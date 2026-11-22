'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  X,
  FileCheck2,
  Inbox,
  FolderCheck,
} from 'lucide-react';
import { formatBytes, SaveMode } from '@/lib/api';
import { AsyncButton } from '@/components/ui/Loaders';

interface SaveDialogProps {
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  onSaveToSession?: (name: string) => void;
  savingToSession?: boolean;
  onSaveFixedFolder?: (name: string) => Promise<boolean> | void;
  savingToFixedFolder?: boolean;
  saveMode?: SaveMode;
  defaultOutputDir?: string;
  blobSize?: number;
  extraInfo?: React.ReactNode;
}

export default function SaveDialog({
  defaultName,
  onConfirm,
  onCancel,
  onSaveToSession,
  savingToSession = false,
  onSaveFixedFolder,
  savingToFixedFolder = false,
  saveMode = 'ask',
  defaultOutputDir,
  blobSize,
  extraInfo,
}: SaveDialogProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  const handleFixedFolder = () => {
    const trimmed = name.trim();
    if (!trimmed || !onSaveFixedFolder) return;
    onSaveFixedFolder(trimmed);
  };

  const handleSendSession = () => {
    const trimmed = name.trim();
    if (!trimmed || !onSaveToSession) return;
    onSaveToSession(trimmed);
  };

  const preferFixed = saveMode === 'fixed_folder' && Boolean(onSaveFixedFolder);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-dialog-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] shadow-2xl p-6 w-full max-w-md relative text-[var(--fg)]">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar ventana"
          className="absolute top-4 right-4 p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-[var(--radius-control)] border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 id="save-dialog-title" className="text-lg font-bold text-[var(--fg)]">
              Archivo listo
            </h3>
            <p className="text-xs text-[var(--fg-muted)]">
              Procesado localmente en 127.0.0.1
            </p>
          </div>
        </div>

        {extraInfo && <div className="mb-4">{extraInfo}</div>}

        {typeof blobSize === 'number' && blobSize > 0 && (
          <div className="mb-4 flex items-center justify-between px-3.5 py-2.5 rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--fg-muted)]">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileCheck2 className="w-4 h-4 text-[var(--fg)]" />
              Tamaño resultante
            </span>
            <span className="font-mono font-semibold text-[var(--fg)]">
              {formatBytes(blobSize)}
            </span>
          </div>
        )}

        <div className="mb-5">
          <label
            htmlFor="save-file-name"
            className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-1.5"
          >
            Nombre del archivo
          </label>
          <input
            id="save-file-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] rounded-[var(--radius-control)] px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="Nombre del archivo"
            autoFocus
            onKeyDown={(e) =>
              e.key === 'Enter' && (preferFixed ? handleFixedFolder() : handleConfirm())
            }
          />
          {defaultOutputDir && onSaveFixedFolder && (
            <p className="mt-1.5 text-[10px] font-mono text-[var(--fg-muted)] truncate">
              Carpeta fija: {defaultOutputDir}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] font-medium py-2.5 rounded-[var(--radius-control)] hover:border-[var(--border-strong)] transition-colors text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={preferFixed ? handleFixedFolder : handleConfirm}
              disabled={!name.trim() || savingToFixedFolder}
              className="flex-1 font-semibold py-2.5 rounded-[var(--radius-control)] transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 text-xs sm:text-sm"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-fg)',
              }}
            >
              {preferFixed ? (
                <>
                  <FolderCheck className="w-4 h-4" />
                  <span>Guardar en carpeta fija</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar</span>
                </>
              )}
            </button>
          </div>

          {onSaveFixedFolder && (
            <AsyncButton
              pending={savingToFixedFolder}
              disabled={!name.trim()}
              onClick={preferFixed ? handleConfirm : handleFixedFolder}
              icon={preferFixed ? <Download className="w-3.5 h-3.5" /> : <FolderCheck className="w-3.5 h-3.5" />}
              className="w-full py-2 px-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-medium text-[var(--fg)]"
            >
              {preferFixed
                ? 'Elegir otra ubicación (Descargar navegador)'
                : 'Guardar directo en carpeta fija'}
            </AsyncButton>
          )}

          {onSaveToSession && (
            <button
              type="button"
              disabled={!name.trim() || savingToSession}
              onClick={handleSendSession}
              className="w-full py-2.5 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--bg)] hover:border-[var(--accent)] text-xs font-semibold text-[var(--fg)] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>
                {savingToSession
                  ? 'Guardando en la sesión...'
                  : 'Guardar en Archivos de Sesión y abrir en otra herramienta'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
