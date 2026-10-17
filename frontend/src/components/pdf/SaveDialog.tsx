'use client';

import { useState, useEffect } from 'react';
import { Download, CheckCircle2, X, FileCheck2 } from 'lucide-react';
import { formatBytes } from '@/lib/api';

interface SaveDialogProps {
  defaultName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  blobSize?: number;
  extraInfo?: React.ReactNode;
}

export default function SaveDialog({
  defaultName,
  onConfirm,
  onCancel,
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-dialog-title"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3
              id="save-dialog-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              ¡Documento listo!
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Procesado localmente en tu dispositivo
            </p>
          </div>
        </div>

        {extraInfo && <div className="mb-4">{extraInfo}</div>}

        {typeof blobSize === 'number' && blobSize > 0 && (
          <div className="mb-4 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-200/70 dark:border-slate-700/70 text-xs text-gray-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileCheck2 className="w-4 h-4 text-brand" />
              Tamaño del archivo resultante
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatBytes(blobSize)}
            </span>
          </div>
        )}

        <div className="mb-5">
          <label
            htmlFor="save-file-name"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5"
          >
            Nombre del archivo
          </label>
          <input
            id="save-file-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl px-3.5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="Nombre del archivo"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
