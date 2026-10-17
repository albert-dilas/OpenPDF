'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import {
  apiClient,
  extractErrorMessage,
  formatBytes,
  PdfInfoResponse,
} from '@/lib/api';
import {
  ArrowLeft,
  FileSliders,
  FileText,
  Eraser,
  RotateCcw,
  Trash2,
  Loader2,
  Lock,
  Unlock,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MetadataForm {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

const EMPTY_METADATA: MetadataForm = {
  title: '',
  author: '',
  subject: '',
  keywords: '',
};

export default function MetadataPDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [originalMetadata, setOriginalMetadata] = useState<MetadataForm>(EMPTY_METADATA);
  const [form, setForm] = useState<MetadataForm>(EMPTY_METADATA);

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

  const loadMetadataInfo = useCallback(async (file: File) => {
    setLoadingInfo(true);
    setIsEncrypted(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<PdfInfoResponse>('/pdf-info/', formData);
      if (data.encrypted) {
        setIsEncrypted(true);
        return;
      }

      setPageCount(data.page_count || 0);
      const loaded: MetadataForm = {
        title: data.metadata?.title ?? '',
        author: data.metadata?.author ?? '',
        subject: data.metadata?.subject ?? '',
        keywords: data.metadata?.keywords ?? '',
      };
      setOriginalMetadata(loaded);
      setForm(loaded);
    } catch (err) {
      const msg = await extractErrorMessage(
        err,
        'No se pudieron leer los metadatos iniciales del documento.'
      );
      toast.error(msg);
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      loadMetadataInfo(files[0]);
    } else {
      setForm(EMPTY_METADATA);
      setOriginalMetadata(EMPTY_METADATA);
      setPageCount(0);
      setIsEncrypted(false);
    }
  }, [files, loadMetadataInfo]);

  const handleClearFields = () => {
    setForm(EMPTY_METADATA);
    toast.success('Campos de metadatos limpiados.');
  };

  const handleRestoreFields = () => {
    setForm({ ...originalMetadata });
    toast.success('Metadatos originales restaurados.');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!files[0]) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('title', form.title);
    formData.append('author', form.author);
    formData.append('subject', form.subject);
    formData.append('keywords', form.keywords);

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/metadata/',
      formData,
      fallbackFileName: `${baseName}_metadatos.pdf`,
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
            Editar Metadatos PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Consulta, modifica o elimina las propiedades ocultas de tu documento PDF (título,
            autor, asunto y palabras clave) antes de compartirlo.
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
          <div className="max-w-3xl mx-auto">
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
                  Editar Metadatos PDF
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cambiar archivo
              </button>
            </div>

            {/* File summary card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between gap-4 shadow-card">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-brand/15 text-brand shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate"
                    title={files[0].name}
                  >
                    {files[0].name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {formatBytes(files[0].size)}
                    {pageCount > 0 ? ` · ${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}` : ''}
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Local
              </span>
            </div>

            {loadingInfo ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>Leyendo propiedades actuales del PDF...</span>
                </div>
                <div className="h-11 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-11 bg-gray-100 dark:bg-slate-800 rounded-xl" />
              </div>
            ) : isEncrypted ? (
              <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/70 rounded-3xl p-8 text-center shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Este PDF está protegido con contraseña
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Desbloquea el documento primero para poder inspeccionar o modificar sus metadatos.
                </p>
                <Link
                  href="/unlock-pdf"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-md transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  Ir a Desbloquear PDF
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-card space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Propiedades del Documento
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Edita los campos o déjalos en blanco para eliminar esa información del PDF.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRestoreFields}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleClearFields}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand bg-red-50 dark:bg-brand/15 hover:bg-red-100 dark:hover:bg-brand/25 border border-red-200/70 dark:border-brand/30 transition-colors"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Limpiar campos
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="meta-title"
                      className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
                    >
                      Título del documento
                    </label>
                    <input
                      id="meta-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej. Informe Financiero Anual 2026"
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="meta-author"
                      className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
                    >
                      Autor
                    </label>
                    <input
                      id="meta-author"
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                      placeholder="Ej. Nombre o Organización"
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="meta-subject"
                      className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
                    >
                      Asunto
                    </label>
                    <input
                      id="meta-subject"
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="Ej. Resumen ejecutivo"
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="meta-keywords"
                      className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-300 mb-1.5"
                    >
                      Palabras clave (Keywords)
                    </label>
                    <input
                      id="meta-keywords"
                      type="text"
                      value={form.keywords}
                      onChange={(e) => setForm((prev) => ({ ...prev, keywords: e.target.value }))}
                      placeholder="Ej. finanzas, contrato, auditoría (separadas por coma)"
                      className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <FileSliders className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Privacidad y Metadatos
            </h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/70 dark:border-slate-800 leading-relaxed">
              Los archivos PDF suelen almacenar el nombre del autor original o el asunto sin que se
              vea en las páginas. Puedes actualizar estos datos o usar{' '}
              <strong>Limpiar campos</strong> para anonimizar el documento.
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
                    {status === 'uploading'
                      ? 'Subiendo documento...'
                      : 'Guardando metadatos...'}
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
              disabled={isProcessing || loadingInfo || isEncrypted}
              onClick={() => handleSubmit()}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Guardando...' : 'Aplicar Metadatos'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
