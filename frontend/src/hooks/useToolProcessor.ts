'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  apiClient,
  extractErrorMessage,
  extractFileNameFromDisposition,
} from '@/lib/api';

export type ProcessorStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export interface ProcessRequestOptions {
  endpoint: string;
  formData: FormData;
  fallbackFileName: string;
  getSuccessMessage?: (headers: Record<string, string>) => string | null;
  toastDuration?: number;
}

export function useToolProcessor() {
  const [status, setStatus] = useState<ProcessorStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [defaultFileName, setDefaultFileName] = useState<string>('');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setUploadProgress(0);
    setProcessStatus('');
    toast('Procesamiento cancelado.');
  }, []);

  const process = useCallback(async ({
    endpoint,
    formData,
    fallbackFileName,
    getSuccessMessage,
    toastDuration = 4000,
  }: ProcessRequestOptions): Promise<boolean> => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('uploading');
    setUploadProgress(0);
    setProcessStatus('Subiendo archivo...');
    setError(null);
    setResponseHeaders({});

    try {
      const response = await apiClient.post(endpoint, formData, {
        responseType: 'blob',
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
            if (pct >= 100) {
              setStatus('processing');
              setProcessStatus('Procesando documento...');
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
      setResponseHeaders(normalizedHeaders);

      const contentType = normalizedHeaders['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const resolvedName = extractFileNameFromDisposition(
        normalizedHeaders['content-disposition'],
        fallbackFileName
      );

      setPendingBlob(blob);
      setDefaultFileName(resolvedName);
      setStatus('done');
      setProcessStatus('');

      const customMsg = getSuccessMessage ? getSuccessMessage(normalizedHeaders) : null;
      toast.success(customMsg || '¡Documento procesado con éxito!', {
        duration: toastDuration,
      });
      return true;
    } catch (err: unknown) {
      if (axios.isCancel(err) || (axios.isAxiosError(err) && err.code === 'ERR_CANCELED')) {
        setStatus('idle');
        setUploadProgress(0);
        setProcessStatus('');
        return false;
      }
      const msg = await extractErrorMessage(err);
      setError(msg);
      setStatus('error');
      setProcessStatus('');
      toast.error(msg);
      return false;
    } finally {
      abortControllerRef.current = null;
      setUploadProgress(0);
    }
  }, []);

  const handleSave = useCallback(
    (fileName: string, onAfterSave?: () => void) => {
      if (!pendingBlob) return;
      const url = window.URL.createObjectURL(pendingBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setPendingBlob(null);
      setStatus('idle');
      onAfterSave?.();
    },
    [pendingBlob]
  );

  const dismissSave = useCallback(() => {
    setPendingBlob(null);
    setStatus('idle');
  }, []);

  const resetError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const isProcessing = status === 'uploading' || status === 'processing';

  return {
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
    dismissSave,
    resetError,
  };
}
