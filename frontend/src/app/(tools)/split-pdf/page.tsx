'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes } from '@/lib/api';
import {
  FileText,
  Settings2,
  X,
  Loader2,
  ArrowLeft,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export default function SplitPDFPage() {
  const { files, addFiles, removeFile, clearFiles } = useFileStore();
  const [pageRanges, setPageRanges] = useState('');
  const {
    status,
    isProcessing,
    uploadProgress,
    processStatus,
    error,
    pendingBlob,
    defaultFileName,
    process,
    cancel,
    handleSave,
    dismissSave,
  } = useToolProcessor();

  useEffect(() => {
    return () => {
      clearFiles();
    };
  }, [clearFiles]);

  const handleProcess = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    if (pageRanges.trim()) {
      formData.append('page_ranges', pageRanges.trim());
    }

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/split/',
      formData,
      fallbackFileName: `${baseName}_split.zip`,
    });
  };

  if (files.length === 0) {
    return (
      <div className="flex-grow py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Todas las herramientas
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            Dividir PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Extrae páginas específicas por rangos o divide cada página en archivos independientes.
          </p>
          <Uploader onFilesSelected={addFiles} multiple={false} accept=".pdf" />
        </div>
      </div>
    );
  }

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName}
          blobSize={pendingBlob.size}
          onConfirm={(fileName) => handleSave(fileName, clearFiles)}
          onCancel={dismissSave}
        />
      )}

      <div className="flex-grow flex flex-col lg:flex-row">
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a herramientas
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Dividir PDF
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cambiar archivo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className={`relative group bg-white dark:bg-slate-900 rounded-2xl shadow-card p-6 flex flex-col items-center justify-center border transition-all ${
                    isProcessing
                      ? 'border-gray-200 dark:border-slate-800 opacity-60'
                      : 'border-gray-200/80 dark:border-slate-800 hover:border-brand/60'
                  }`}
                >
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => removeFile(idx)}
                    className="absolute top-2.5 right-2.5 bg-red-50 dark:bg-slate-800 hover:bg-brand text-gray-500 dark:text-slate-300 hover:text-white rounded-xl p-1.5 transition-colors"
                    aria-label="Eliminar archivo"
                  >
                    <X size={15} />
                  </button>
                  <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-brand/15 my-3">
                    <FileText className="text-brand w-12 h-12" />
                  </div>
                  <p
                    className="text-sm text-center font-semibold text-gray-900 dark:text-slate-100 truncate w-full"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <span className="mt-1 text-xs font-medium text-gray-400 dark:text-slate-500">
                    {formatBytes(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Opciones de División</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4 overflow-y-auto">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/70 dark:border-slate-800">
              Extrae páginas específicas o deja el campo vacío para obtener{' '}
              <strong>cada página</strong> como PDF independiente en un archivo ZIP.
            </div>

            <div>
              <label
                htmlFor="page-ranges-input"
                className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
              >
                Páginas o rangos a extraer
              </label>
              <input
                id="page-ranges-input"
                type="text"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                placeholder="Ej: 1, 3-5, 7 (vacío = todas)"
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                Formato: &quot;1,3-5,7&quot; — números separados por coma, rangos con guion.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 rounded-xl p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6 bg-gray-50/80 dark:bg-slate-900/90 border-t border-gray-200 dark:border-slate-800 space-y-3">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-slate-300">
                  <span>
                    {status === 'uploading' ? 'Subiendo archivo...' : 'Dividiendo PDF...'}
                  </span>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <span className="font-mono font-bold">{uploadProgress}%</span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`bg-brand h-2 rounded-full transition-all duration-300 ${
                      status === 'processing' ? 'animate-pulse w-full' : ''
                    }`}
                    style={{
                      width: status === 'processing' ? '100%' : `${uploadProgress}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  className="w-full py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar operación
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcess}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Dividiendo...' : 'Dividir PDF'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
