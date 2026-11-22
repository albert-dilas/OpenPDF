'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import FileDropZone, { DropZoneInteractionState } from '@/components/ui/FileDropZone';
import { selectMaxFileSizeMb, useSystemStore } from '@/store/useSystemStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { apiClient, extractErrorMessage } from '@/lib/api';

interface UploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

let inFlightChainedLoad: { id: string; promise: Promise<File> } | null = null;

export default function Uploader({
  onFilesSelected,
  accept = '.pdf',
  multiple = true,
}: UploaderProps) {
  const pathname = (usePathname() || '/').replace(/\/+$/, '') || '/';
  const [validationError, setValidationError] = useState<string | null>(null);
  const [chainedState, setChainedState] = useState<'idle' | 'pending'>('idle');
  const maxFileSizeMb = useSystemStore(selectMaxFileSizeMb);
  const pendingChainedAsset = useWorkspaceStore((s) => s.pendingChainedAsset);
  const clearPendingChainedAsset = useWorkspaceStore((s) => s.clearPendingChainedAsset);

  const allowedExtensions = accept
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean);

  useEffect(() => {
    if (!pendingChainedAsset) return;
    const { asset, targetHref } = pendingChainedAsset;
    const normalizedTarget = (targetHref || '/').replace(/\/+$/, '') || '/';
    if (normalizedTarget !== pathname) return;

    const exts = accept
      .split(',')
      .map((ext) => ext.trim().toLowerCase())
      .filter(Boolean);
    const lowerName = asset.filename.toLowerCase();
    const matchesExt =
      exts.length === 0 || exts.some((ext) => lowerName.endsWith(ext));

    if (!matchesExt) {
      setValidationError(
        `Formato no compatible (${asset.filename}). Formatos admitidos: ${exts
          .join(', ')
          .toUpperCase()}`
      );
      clearPendingChainedAsset();
      return;
    }

    let cancelled = false;
    setChainedState('pending');

    if (!inFlightChainedLoad || inFlightChainedLoad.id !== asset.id) {
      const promise = apiClient
        .get<Blob>(`/workspace/assets/${asset.id}/download`, {
          responseType: 'blob',
          timeout: 60000,
        })
        .then(({ data }) => {
          return new File([data], asset.filename, {
            type: asset.mime_type || data.type || 'application/octet-stream',
          });
        });
      inFlightChainedLoad = { id: asset.id, promise };
    }

    inFlightChainedLoad.promise
      .then((file) => {
        if (cancelled) return;
        inFlightChainedLoad = null;
        clearPendingChainedAsset();
        setChainedState('idle');
        onFilesSelected([file]);
      })
      .catch(async (err) => {
        if (cancelled) return;
        inFlightChainedLoad = null;
        clearPendingChainedAsset();
        setChainedState('idle');
        const msg = await extractErrorMessage(err, 'No se pudo cargar el archivo desde Bandeja Viva.');
        setValidationError(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [accept, clearPendingChainedAsset, onFilesSelected, pathname, pendingChainedAsset]);

  const validateAndSelect = (rawFiles: File[]) => {
    setValidationError(null);
    if (!rawFiles.length) return;

    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of rawFiles) {
      const lowerName = file.name.toLowerCase();
      const matchesExt =
        allowedExtensions.length === 0 ||
        allowedExtensions.some((ext) => lowerName.endsWith(ext));

      if (!matchesExt) {
        setValidationError(
          `Formato no compatible (${file.name}). Formatos admitidos: ${allowedExtensions
            .join(', ')
            .toUpperCase()}`
        );
        continue;
      }

      if (file.size > maxBytes) {
        setValidationError(
          `El archivo "${file.name}" supera el límite de ${maxFileSizeMb} MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  };

  const interactionState: DropZoneInteractionState =
    chainedState === 'pending'
      ? 'pending'
      : validationError
      ? 'error'
      : 'idle';

  return (
    <div className="mt-6 max-w-3xl w-full mx-auto">
      <FileDropZone
        variant="canvas"
        interactionState={interactionState}
        onFilesSelected={validateAndSelect}
        accept={accept}
        multiple={multiple}
        ariaLabel={multiple ? 'Seleccionar o arrastrar archivos' : 'Seleccionar o arrastrar un archivo'}
        buttonLabel={multiple ? 'Seleccionar archivos' : 'Seleccionar archivo'}
        pendingLabel="Cargando desde Bandeja Viva..."
        subtitle={`Arrastra y suelta ${multiple ? 'tus documentos' : 'tu documento'} aquí`}
        errorMessage={validationError}
        footerSlot={
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--fg-muted)]">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--fg)] font-mono text-[11px]">
              {allowedExtensions.join(', ').toUpperCase()}
            </span>
            <span>·</span>
            <span className="font-mono text-[11px]">Máx. {maxFileSizeMb} MB</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Local
            </span>
          </div>
        }
      />
    </div>
  );
}
