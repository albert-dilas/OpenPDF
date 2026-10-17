'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes } from '@/lib/api';
import {
  ArrowLeft,
  PenTool,
  Upload,
  Eraser,
  Trash2,
  Settings2,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

type SignInputMode = 'draw' | 'upload';
type PageSelectionMode = 'last' | 'first' | 'all' | 'custom';
type PositionOption =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'center';

const INK_COLORS = [
  { id: '#0f172a', label: 'Negro Tinta' },
  { id: '#1d4ed8', label: 'Azul Corporativo' },
  { id: '#b91c1c', label: 'Rojo Sello' },
];

const POSITIONS: { id: PositionOption; label: string }[] = [
  { id: 'bottom-right', label: 'Inferior derecha' },
  { id: 'bottom-left', label: 'Inferior izquierda' },
  { id: 'bottom-center', label: 'Inferior centro' },
  { id: 'top-right', label: 'Superior derecha' },
  { id: 'top-left', label: 'Superior izquierda' },
  { id: 'center', label: 'Centro de página' },
];

export default function SignPDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [inputMode, setInputMode] = useState<SignInputMode>('draw');
  const [inkColor, setInkColor] = useState<string>('#0f172a');
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [uploadedSigFile, setUploadedSigFile] = useState<File | null>(null);
  const [uploadedSigPreview, setUploadedSigPreview] = useState<string | null>(null);

  const [pageMode, setPageMode] = useState<PageSelectionMode>('last');
  const [customPages, setCustomPages] = useState<string>('1');
  const [position, setPosition] = useState<PositionOption>('bottom-right');
  const [scalePct, setScalePct] = useState<number>(22);
  const [labelText, setLabelText] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

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

  useEffect(() => {
    if (!uploadedSigFile) {
      setUploadedSigPreview(null);
      return;
    }
    const url = URL.createObjectURL(uploadedSigFile);
    setUploadedSigPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadedSigFile]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const getCanvasPoint = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (isProcessing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pt = getCanvasPoint(e);
    isDrawingRef.current = true;
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current || isProcessing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const getCanvasBlob = (): Promise<Blob | null> =>
    new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });

  const handleSignSubmit = async () => {
    if (!files[0]) return;

    const formData = new FormData();
    formData.append('file', files[0]);

    if (inputMode === 'draw') {
      if (!hasDrawn) {
        toast.error('Dibuja tu firma en el recuadro antes de procesar.');
        return;
      }
      const sigBlob = await getCanvasBlob();
      if (!sigBlob) {
        toast.error('No se pudo generar la imagen de la firma.');
        return;
      }
      formData.append('signature', sigBlob, 'firma_manuscrita.png');
    } else {
      if (!uploadedSigFile) {
        toast.error('Selecciona una imagen PNG o JPG con tu firma o sello.');
        return;
      }
      formData.append('signature', uploadedSigFile);
    }

    const pagesValue = pageMode === 'custom' ? customPages.trim() || '1' : pageMode;
    formData.append('pages', pagesValue);
    formData.append('position', position);
    formData.append('scale', (scalePct / 100).toFixed(2));
    if (labelText.trim()) {
      formData.append('label_text', labelText.trim());
    }

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/sign/',
      formData,
      fallbackFileName: `${baseName}_firmado.pdf`,
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
            Firmar y Sellar PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Dibuja tu firma manuscrita o sube la imagen de tu sello corporativo para estamparlo en
            cualquier página de tu documento PDF de forma 100% local.
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-brand mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver a herramientas
                </Link>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Firmar / Sellar PDF
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cambiar archivo
              </button>
            </div>

            {/* File summary card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {files[0].name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {formatBytes(files[0].size)} · Procesamiento local
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Local
              </span>
            </div>

            {/* Signature Mode Selector */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 space-y-5 shadow-card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  1. Diseña o sube tu firma / sello
                </h2>
                <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setInputMode('draw')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      inputMode === 'draw'
                        ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                        : 'text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Dibujar firma
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      inputMode === 'upload'
                        ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                        : 'text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir imagen (PNG/JPG)
                  </button>
                </div>
              </div>

              {inputMode === 'draw' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        Color de tinta:
                      </span>
                      {INK_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setInkColor(c.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            inkColor === c.id
                              ? 'border-brand bg-red-50/60 dark:bg-slate-800 text-gray-900 dark:text-white'
                              : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: c.id }}
                          />
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Limpiar trazo
                    </button>
                  </div>

                  <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={680}
                      height={220}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-48 cursor-crosshair touch-none block"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                    Traza tu firma dentro del recuadro blanco con el ratón o pantalla táctil. Se
                    exportará con fondo transparente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-brand transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setUploadedSigFile(f);
                      }}
                    />
                    {uploadedSigPreview ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={uploadedSigPreview}
                          alt="Vista previa de firma"
                          className="max-h-32 object-contain bg-white p-2 rounded-xl border border-gray-200"
                        />
                        <span className="text-xs font-semibold text-brand">
                          {uploadedSigFile?.name} (Clic para cambiar imagen)
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                          Seleccionar imagen de firma o sello (.PNG o .JPG)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          Se recomienda PNG con fondo transparente para mejor acabado
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ubicación y Sello</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                Páginas donde firmar
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'last', label: 'Última página' },
                  { id: 'first', label: 'Primera página' },
                  { id: 'all', label: 'Todas las páginas' },
                  { id: 'custom', label: 'Rango específico' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPageMode(opt.id as PageSelectionMode)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                      pageMode === opt.id
                        ? 'border-brand bg-red-50/70 dark:bg-brand/15 text-brand dark:text-red-400'
                        : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {pageMode === 'custom' && (
                <input
                  type="text"
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  placeholder="Ej. 1, 3-5"
                  className="mt-2.5 w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                Posición en la página
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                      position === pos.id
                        ? 'border-brand bg-red-50/70 dark:bg-brand/15 text-brand dark:text-red-400'
                        : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                <span>Tamaño relativo</span>
                <span className="text-brand">{scalePct}%</span>
              </div>
              <input
                type="range"
                min={12}
                max={45}
                value={scalePct}
                onChange={(e) => setScalePct(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                Texto de pie de firma (Opcional)
              </label>
              <input
                type="text"
                maxLength={80}
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="Ej. Aprobado por Gerencia · 2026-10-17"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs sm:text-sm"
              />
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
                <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-slate-300">
                  <span>{status === 'uploading' ? 'Subiendo...' : 'Estampando firma...'}</span>
                  {uploadProgress > 0 && uploadProgress < 100 && <span>{uploadProgress}%</span>}
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  className="w-full py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancelar operación
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSignSubmit}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base transition-all flex items-center justify-center gap-2"
            >
              {isProcessing && <Loader2 className="animate-spin" size={20} />}
              <span>{isProcessing ? processStatus || 'Firmando...' : 'Aplicar Firma al PDF'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
