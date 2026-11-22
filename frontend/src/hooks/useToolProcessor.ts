'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  apiClient,
  cancelActiveRequest,
  checkDiskQuota,
  extractErrorMessage,
  extractFileNameFromDisposition,
  isAbortError,
  isOfflineError,
  openLocalFolder,
  saveOutputToFixedFolder,
} from '@/lib/api';
import { selectDesktopConfig, useSystemStore } from '@/store/useSystemStore';

export type ProcessorStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export type ProcessorMachineState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; processStatus: string }
  | { status: 'processing'; processStatus: string }
  | {
      status: 'done';
      pendingBlob: Blob;
      defaultFileName: string;
      responseHeaders: Record<string, string>;
    }
  | { status: 'aborted' }
  | { status: 'offline'; error: string }
  | { status: 'error'; error: string };

export interface ProcessRequestOptions {
  endpoint: string;
  formData: FormData;
  fallbackFileName: string;
  inputBytes?: number;
  getSuccessMessage?: (headers: Record<string, string>) => string | null;
  toastDuration?: number;
}

const EMPTY_HEADERS: Record<string, string> = {};

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useToolProcessor() {
  const [machine, setMachine] = useState<ProcessorMachineState>({ status: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      const reqId = activeRequestIdRef.current;
      activeRequestIdRef.current = null;
      abortControllerRef.current?.abort();
      if (reqId) {
        cancelActiveRequest(reqId).catch(() => {});
      }
    };
  }, []);

  const cancel = useCallback(() => {
    const reqId = activeRequestIdRef.current;
    activeRequestIdRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (reqId) {
      cancelActiveRequest(reqId).catch(() => {});
    }
    setMachine({ status: 'aborted' });
    toast('Procesamiento cancelado.');
  }, []);

  const process = useCallback(
    async ({
      endpoint,
      formData,
      fallbackFileName,
      inputBytes,
      getSuccessMessage,
      toastDuration = 4000,
    }: ProcessRequestOptions): Promise<boolean> => {
      if (activeRequestIdRef.current) {
        cancelActiveRequest(activeRequestIdRef.current).catch(() => {});
      }
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestId = createRequestId();
      activeRequestIdRef.current = requestId;

      let totalBytes = typeof inputBytes === 'number' && inputBytes > 0 ? inputBytes : 0;
      if (totalBytes <= 0) {
        formData.forEach((value) => {
          if (typeof Blob !== 'undefined' && value instanceof Blob) {
            totalBytes += value.size;
          }
        });
      }

      if (totalBytes > 0) {
        try {
          const quota = await checkDiskQuota(totalBytes);
          if (quota.critical_low) {
            setMachine({ status: 'error', error: quota.message });
            toast.error(quota.message, { duration: 6000 });
            activeRequestIdRef.current = null;
            abortControllerRef.current = null;
            return false;
          }
          if (quota.low_space_warning) {
            toast(quota.message, { duration: 4500 });
          }
        } catch {
          // Silently skip quota preflight if backend is unavailable or timed out
        }
      }

      setMachine({
        status: 'uploading',
        progress: 0,
        processStatus: 'Subiendo archivo...',
      });

      const desktopConfig = selectDesktopConfig(useSystemStore.getState());
      const smartZipHeader = desktopConfig?.smart_zip_downloads === false ? '0' : '1';

      try {
        const response = await apiClient.post(endpoint, formData, {
          responseType: 'blob',
          signal: controller.signal,
          headers: {
            'X-Request-Id': requestId,
            'X-Smart-Zip': smartZipHeader,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              if (pct >= 100) {
                setMachine({
                  status: 'processing',
                  processStatus: 'Procesando documento...',
                });
              } else {
                setMachine({
                  status: 'uploading',
                  progress: pct,
                  processStatus: 'Subiendo archivo...',
                });
              }
            }
          },
        });

        const normalizedHeaders: Record<string, string> = {};
        if (response.headers) {
          Object.entries(response.headers).forEach(([k, v]) => {
            if (typeof v === 'string') {
              normalizedHeaders[k.toLowerCase()] = v;
            } else if (v !== undefined && v !== null) {
              normalizedHeaders[k.toLowerCase()] = String(v);
            }
          });
        }

        const contentType = normalizedHeaders['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        const resolvedName = extractFileNameFromDisposition(
          normalizedHeaders['content-disposition'],
          fallbackFileName
        );

        setMachine({
          status: 'done',
          pendingBlob: blob,
          defaultFileName: resolvedName,
          responseHeaders: normalizedHeaders,
        });

        const customMsg = getSuccessMessage ? getSuccessMessage(normalizedHeaders) : null;
        toast.success(customMsg || 'Documento procesado con éxito.', {
          duration: toastDuration,
        });
        return true;
      } catch (err: unknown) {
        if (isAbortError(err)) {
          setMachine({ status: 'aborted' });
          return false;
        }
        const msg = await extractErrorMessage(err);
        setMachine(
          isOfflineError(err)
            ? { status: 'offline', error: msg }
            : { status: 'error', error: msg }
        );
        toast.error(msg);
        return false;
      } finally {
        if (activeRequestIdRef.current === requestId) {
          activeRequestIdRef.current = null;
        }
        abortControllerRef.current = null;
      }
    },
    []
  );

  const handleSave = useCallback(
    (fileName: string, onAfterSave?: () => void) => {
      if (machine.status !== 'done') return;
      const url = window.URL.createObjectURL(machine.pendingBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMachine({ status: 'idle' });
      onAfterSave?.();
    },
    [machine]
  );

  const handleSaveFixedFolder = useCallback(
    async (fileName: string, onAfterSave?: () => void) => {
      if (machine.status !== 'done') return false;
      try {
        const res = await saveOutputToFixedFolder(machine.pendingBlob, fileName);
        setMachine({ status: 'idle' });
        onAfterSave?.();
        toast.success(
          (tInstance) =>
            React.createElement(
              'div',
              { className: 'flex items-center gap-3 text-xs' },
              React.createElement('span', null, `Guardado en ${res.filename}`),
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => {
                    toast.dismiss(tInstance.id);
                    openLocalFolder('output').catch(() => {});
                  },
                  className: 'underline font-semibold',
                },
                'Abrir carpeta'
              )
            ),
          { duration: 5000 }
        );
        return true;
      } catch (err) {
        const msg = await extractErrorMessage(
          err,
          'No se pudo guardar en la carpeta fija configurada.'
        );
        toast.error(msg);
        return false;
      }
    },
    [machine]
  );

  const dismissSave = useCallback(() => {
    setMachine({ status: 'idle' });
  }, []);

  const resetError = useCallback(() => {
    setMachine((prev) =>
      prev.status === 'error' || prev.status === 'offline' ? { status: 'idle' } : prev
    );
  }, []);

  const status: ProcessorStatus =
    machine.status === 'aborted'
      ? 'idle'
      : machine.status === 'offline'
      ? 'error'
      : machine.status;

  const isProcessing = machine.status === 'uploading' || machine.status === 'processing';
  const uploadProgress = machine.status === 'uploading' ? machine.progress : 0;
  const processStatus =
    machine.status === 'uploading' || machine.status === 'processing'
      ? machine.processStatus
      : '';
  const error =
    machine.status === 'error' || machine.status === 'offline' ? machine.error : null;
  const pendingBlob = machine.status === 'done' ? machine.pendingBlob : null;
  const defaultFileName = machine.status === 'done' ? machine.defaultFileName : '';
  const responseHeaders =
    machine.status === 'done' ? machine.responseHeaders : EMPTY_HEADERS;

  return {
    machine,
    status,
    isProcessing,
    uploadProgress,
    processStatus,
    error,
    pendingBlob,
    defaultFileName,
    responseHeaders,
    process,
    cancel,
    handleSave,
    handleSaveFixedFolder,
    dismissSave,
    resetError,
  };
}
