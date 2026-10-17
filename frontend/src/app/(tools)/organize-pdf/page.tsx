'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useRef, useCallback } from 'react';
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
  PdfPageInfo,
} from '@/lib/api';
import {
  ArrowLeft,
  RotateCw,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Loader2,
  Lock,
  Unlock,
  FileText,
  GripVertical,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EditablePage extends PdfPageInfo {
  uid: string;
  addedRotation: number;
  displayPageNumber: number;
}

function getThumbnailSrc(thumbnail: string | null): string | null {
  if (!thumbnail) return null;
  if (thumbnail.startsWith('data:')) return thumbnail;
  return `data:image/png;base64,${thumbnail}`;
}

export default function OrganizePDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [initialPages, setInitialPages] = useState<EditablePage[]>([]);
  const [pages, setPages] = useState<EditablePage[]>([]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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

  const loadPdfInfo = useCallback(async (file: File) => {
    setLoadingInfo(true);
    setInfoError(null);
    setIsEncrypted(false);
    setInitialPages([]);
    setPages([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient.post<PdfInfoResponse>('/pdf-info/', formData);
      if (data.encrypted) {
        setIsEncrypted(true);
        return;
      }

      const rawPages = Array.isArray(data.pages) ? data.pages : [];
      const zeroBased = rawPages.length > 0 && rawPages[0].index === 0;
      const mapped: EditablePage[] = rawPages.map((p, idx) => ({
        ...p,
        rotation: p.rotation || 0,
        addedRotation: 0,
        uid: `page-${p.index}-${idx}`,
        displayPageNumber: zeroBased ? p.index + 1 : p.index || idx + 1,
      }));

      setInitialPages(mapped);
      setPages(mapped);
    } catch (err) {
      const msg = await extractErrorMessage(
        err,
        'No se pudo inspeccionar las páginas del archivo PDF.'
      );
      setInfoError(msg);
      toast.error(msg);
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      loadPdfInfo(files[0]);
    } else {
      setInitialPages([]);
      setPages([]);
      setInfoError(null);
      setIsEncrypted(false);
    }
  }, [files, loadPdfInfo]);

  const movePage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  };

  const rotatePage = (idx: number) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === idx
          ? {
              ...p,
              rotation: (p.rotation + 90) % 360,
              addedRotation: (p.addedRotation + 90) % 360,
            }
          : p
      )
    );
  };

  const deletePage = (idx: number) => {
    if (pages.length <= 1) {
      toast.error('El documento debe conservar al menos una página.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const rotateAllPages = () => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + 90) % 360,
        addedRotation: (p.addedRotation + 90) % 360,
      }))
    );
  };

  const restoreAllPages = () => {
    setPages(initialPages.map((p) => ({ ...p })));
    toast('Orden y páginas originales restaurados', { icon: '↩️' });
  };

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
      movePage(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleOrganizeSubmit = async () => {
    if (!files[0] || pages.length === 0) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append(
      'pages',
      JSON.stringify(
        pages.map((p) => ({
          index: p.index,
          rotation: p.rotation,
        }))
      )
    );

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/organize/',
      formData,
      fallbackFileName: `${baseName}_organizado.pdf`,
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
            Organizar PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Visualiza las páginas de tu PDF, reordénalas arrastrando, rótalas individualmente o
            elimina las que no necesites.
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
          <div className="max-w-6xl mx-auto">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a herramientas
                </Link>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Organizar PDF
                  </h1>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                    {files[0].name} · {formatBytes(files[0].size)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pages.length > 0 && !isEncrypted && (
                  <>
                    <button
                      type="button"
                      disabled={isProcessing || loadingInfo}
                      onClick={rotateAllPages}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotar todas 90°
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || loadingInfo}
                      onClick={restoreAllPages}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restaurar
                    </button>
                  </>
                )}
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
            </div>

            {/* Loading Skeleton */}
            {loadingInfo && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>Generando miniaturas de páginas localmente...</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 space-y-3 animate-pulse"
                    >
                      <div className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-slate-800" />
                      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/2 mx-auto" />
                      <div className="h-7 bg-gray-100 dark:bg-slate-800 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encrypted PDF State */}
            {!loadingInfo && isEncrypted && (
              <div className="max-w-xl mx-auto my-8 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/70 rounded-3xl p-8 text-center shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Este PDF está protegido con contraseña
                </h2>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Para previsualizar y organizar sus páginas, primero quita la contraseña con la
                  herramienta <strong>Desbloquear PDF</strong>.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/unlock-pdf"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-bold shadow-md transition-colors"
                  >
                    <Unlock className="w-4 h-4" />
                    Ir a Desbloquear PDF
                  </Link>
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Subir otro archivo
                  </button>
                </div>
              </div>
            )}

            {/* Error State */}
            {!loadingInfo && infoError && (
              <div className="max-w-xl mx-auto my-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/70 rounded-3xl p-8 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  Error al leer el documento
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">{infoError}</p>
                <button
                  type="button"
                  onClick={() => files[0] && loadPdfInfo(files[0])}
                  className="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Pages Grid */}
            {!loadingInfo && !isEncrypted && !infoError && pages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {pages.map((page, idx) => {
                  const thumbSrc = getThumbnailSrc(page.thumbnail);
                  return (
                    <div
                      key={page.uid}
                      draggable={!isProcessing}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragEnter={(e) => handleDragEnter(e, idx)}
                      onDragEnd={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 hover:border-brand/70 shadow-card hover:shadow-md p-3 flex flex-col justify-between transition-all cursor-grab active:cursor-grabbing"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                          <GripVertical className="w-3 h-3 text-gray-400" />
                           Pos. {idx + 1}
                        </span>
                        {page.addedRotation !== 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                            +{page.addedRotation}°
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative aspect-[3/4] rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800 flex items-center justify-center overflow-hidden p-2">
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt={`Página ${page.displayPageNumber}`}
                            style={{ transform: `rotate(${page.addedRotation}deg)` }}
                            className="max-h-full max-w-full object-contain rounded shadow-sm transition-transform duration-200 select-none"
                          />
                        ) : (
                          <div
                            style={{ transform: `rotate(${page.addedRotation}deg)` }}
                            className="flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 transition-transform duration-200"
                          >
                            <FileText className="w-10 h-10 text-brand/70 mb-1.5" />
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                              Pág. {page.displayPageNumber}
                            </span>
                            {page.width > 0 && page.height > 0 && (
                              <span className="text-[10px]">
                                {Math.round(page.width)}×{Math.round(page.height)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Original Page Caption */}
                      <div className="mt-2 text-center">
                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">
                          Pág. original {page.displayPageNumber}
                        </span>
                      </div>

                      {/* Controls Bar */}
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0 || isProcessing}
                            onClick={() => movePage(idx, idx - 1)}
                            aria-label={`Mover página ${page.displayPageNumber} a la izquierda`}
                            title="Mover a la izquierda"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-brand hover:text-brand disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === pages.length - 1 || isProcessing}
                            onClick={() => movePage(idx, idx + 1)}
                            aria-label={`Mover página ${page.displayPageNumber} a la derecha`}
                            title="Mover a la derecha"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-brand hover:text-brand disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => rotatePage(idx)}
                            aria-label={`Rotar página ${page.displayPageNumber} 90 grados`}
                            title="Rotar 90°"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={pages.length <= 1 || isProcessing}
                            onClick={() => deletePage(idx)}
                            aria-label={`Eliminar página ${page.displayPageNumber}`}
                            title="Eliminar página"
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Resumen de Organización
            </h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/70 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Páginas originales</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {initialPages.length}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Páginas en documento final</span>
                <span className="font-bold text-brand">{pages.length}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Páginas eliminadas</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {Math.max(0, initialPages.length - pages.length)}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Arrastra las miniaturas o usa los controles de cada tarjeta para ordenar, girar o
              descartar páginas antes de generar el nuevo PDF.
            </p>

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
                      : 'Aplicando cambios de páginas...'}
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
              disabled={isProcessing || loadingInfo || isEncrypted || pages.length === 0}
              onClick={handleOrganizeSubmit}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 dark:disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base sm:text-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Procesando...' : 'Guardar PDF Organizado'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
