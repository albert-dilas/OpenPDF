'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes } from '@/lib/api';
import {
  FileText,
  X,
  Settings2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  GripVertical,
} from 'lucide-react';

export default function MergePDFPage() {
  const { files, addFiles, removeFile, clearFiles, reorderFiles } = useFileStore();
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

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clearFiles();
    };
  }, [clearFiles]);

  const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
  };

  const handleDrop = () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      reorderFiles(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    await process({
      endpoint: '/merge/',
      formData,
      fallbackFileName: 'archivos_unidos.pdf',
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
            Unir PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Combina varios archivos PDF y ordénalos arrastrando o con un clic. Rápido y 100% local.
          </p>
          <Uploader onFilesSelected={addFiles} multiple={true} accept=".pdf" />
        </div>
      </div>
    );
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName || 'archivos_unidos.pdf'}
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
                  Unir PDF ({files.length} {files.length === 1 ? 'archivo' : 'archivos'})
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar lista
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  draggable={!isProcessing}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnter={(e) => handleDragEnter(e, idx)}
                  onDragEnd={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="relative group bg-white dark:bg-slate-900 rounded-2xl shadow-card p-5 flex flex-col items-center justify-between border border-gray-200/80 dark:border-slate-800 hover:border-brand/60 hover:shadow-md transition-all cursor-grab active:cursor-grabbing min-h-[210px]"
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                      <GripVertical className="w-3 h-3 text-gray-400" />#{idx + 1}
                    </span>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => removeFile(idx)}
                      className="bg-red-50 dark:bg-slate-800 hover:bg-brand text-gray-500 dark:text-slate-300 hover:text-white rounded-xl p-1.5 transition-colors"
                      aria-label={`Eliminar archivo ${file.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-red-50/80 dark:bg-brand/15 my-2">
                    <FileText className="text-brand w-10 h-10" strokeWidth={1.75} />
                  </div>

                  <div className="w-full text-center">
                    <p
                      className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100 truncate w-full px-1"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 w-full flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0 || isProcessing}
                      onClick={() => reorderFiles(idx, idx - 1)}
                      aria-label="Mover archivo a la izquierda"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-brand hover:text-brand disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500">Orden</span>
                    <button
                      type="button"
                      disabled={idx === files.length - 1 || isProcessing}
                      onClick={() => reorderFiles(idx, idx + 1)}
                      aria-label="Mover archivo a la derecha"
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-brand hover:text-brand disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <label className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 min-h-[210px] cursor-pointer hover:bg-red-50/40 dark:hover:bg-slate-900 hover:border-brand hover:text-brand text-gray-500 dark:text-slate-400 transition-all">
                <input
                  id="add-more"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf"
                  disabled={isProcessing}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFiles(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-xs sm:text-sm font-semibold">Añadir más PDFs</span>
              </label>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Opciones de Unión</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/70 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Archivos seleccionados</span>
                <span className="font-bold text-gray-900 dark:text-white">{files.length}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Peso total combinado</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatBytes(totalSize)}
                </span>
              </div>
            </div>

            {files.length < 2 ? (
              <p className="text-xs sm:text-sm text-brand bg-red-50 dark:bg-brand/15 p-3.5 rounded-2xl border border-red-200/70 dark:border-brand/30 font-medium">
                Selecciona al menos 2 archivos PDF para poder unirlos en un solo documento.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Arrastra las tarjetas o usa las flechas para definir el orden final de unión.
              </p>
            )}

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
                    {status === 'uploading' ? 'Subiendo archivos...' : 'Uniendo PDFs...'}
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
              disabled={files.length < 2 || isProcessing}
              onClick={handleMerge}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Uniendo...' : 'Unir PDF'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
