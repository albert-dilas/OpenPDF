'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import {
  apiClient,
  extractErrorMessage,
  formatBytes,
  QrInspectResponse,
  QrVerifyUrlResponse,
} from '@/lib/api';
import {
  ArrowLeft,
  QrCode,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings2,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

type QrMode = 'stamp' | 'inspect';
type PageSelectionMode = 'first' | 'last' | 'all' | 'custom';
type PositionOption =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'center';

const POSITIONS: { id: PositionOption; label: string }[] = [
  { id: 'bottom-right', label: 'Inferior derecha' },
  { id: 'bottom-left', label: 'Inferior izquierda' },
  { id: 'bottom-center', label: 'Inferior centro' },
  { id: 'top-right', label: 'Superior derecha' },
  { id: 'top-left', label: 'Superior izquierda' },
  { id: 'center', label: 'Centro de página' },
];

export default function QrPDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [activeTab, setActiveTab] = useState<QrMode>('stamp');

  // Stamp state
  const [payload, setPayload] = useState<string>('');
  const [verifyOnline, setVerifyOnline] = useState<boolean>(true);
  const [verifyingUrl, setVerifyingUrl] = useState<boolean>(false);
  const [urlCheck, setUrlCheck] = useState<QrVerifyUrlResponse | null>(null);
  const [pageMode, setPageMode] = useState<PageSelectionMode>('first');
  const [customPages, setCustomPages] = useState<string>('1');
  const [position, setPosition] = useState<PositionOption>('bottom-right');
  const [scalePct, setScalePct] = useState<number>(16);
  const [labelText, setLabelText] = useState<string>('');

  // Inspect state
  const [inspecting, setInspecting] = useState<boolean>(false);
  const [inspectResult, setInspectResult] = useState<QrInspectResponse | null>(null);

  const {
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

  const handleVerifyUrl = async () => {
    if (!payload.trim()) {
      toast.error('Ingresa una URL para verificar.');
      return;
    }
    setVerifyingUrl(true);
    setUrlCheck(null);
    const formData = new FormData();
    formData.append('url', payload.trim());

    try {
      const { data } = await apiClient.post<QrVerifyUrlResponse>('/qr/verify-url', formData);
      setUrlCheck(data);
      if (data.reachable) {
        toast.success(`URL activa (${data.status_code} · ${data.elapsed_ms} ms)`);
      } else {
        toast.error(data.error || 'La URL no respondió.');
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo verificar la URL.');
      toast.error(msg);
    } finally {
      setVerifyingUrl(false);
    }
  };

  const handleStampSubmit = async () => {
    if (!files[0]) return;
    if (!payload.trim()) {
      toast.error('Ingresa la URL o texto para el código QR.');
      return;
    }

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('payload', payload.trim());
    formData.append('verify_online', String(verifyOnline));
    formData.append('pages', pageMode === 'custom' ? customPages.trim() || '1' : pageMode);
    formData.append('position', position);
    formData.append('scale', (scalePct / 100).toFixed(2));
    if (labelText.trim()) {
      formData.append('label_text', labelText.trim());
    }

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/qr/stamp',
      formData,
      fallbackFileName: `${baseName}_qr.pdf`,
    });
  };

  const handleInspectPdf = async () => {
    if (!files[0]) return;
    setInspecting(true);
    setInspectResult(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('verify_online', 'true');

    try {
      const { data } = await apiClient.post<QrInspectResponse>('/qr/inspect', formData);
      setInspectResult(data);
      if (data.qr_count === 0) {
        toast('No se detectaron códigos QR en el documento.');
      } else {
        toast.success(`Se detectaron ${data.qr_count} códigos QR en el PDF.`);
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, 'Error al inspeccionar códigos QR.');
      toast.error(msg);
    } finally {
      setInspecting(false);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex-grow py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Todas las herramientas
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800">
              <Globe className="w-3 h-3" />
              Verificación Online
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            Código QR Web en PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Estampa un código QR verificando previamente que la URL destino responda en línea, o
            escanea las páginas de un PDF para auditar los códigos QR existentes.
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
                  Código QR Web en PDF
                </h1>
              </div>

              <button
                type="button"
                disabled={isProcessing || inspecting}
                onClick={clearFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cambiar archivo
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {files[0].name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {formatBytes(files[0].size)}
                  </p>
                </div>
              </div>

              <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('stamp')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'stamp'
                      ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Estampar QR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inspect')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'inspect'
                      ? 'bg-white dark:bg-slate-900 text-brand shadow-sm'
                      : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Inspeccionar QRs del PDF
                </button>
              </div>
            </div>

            {activeTab === 'stamp' ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 space-y-5 shadow-card">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                    URL de destino o contenido del código QR
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={payload}
                      onChange={(e) => setPayload(e.target.value)}
                      placeholder="https://albert-dilas.github.io/OpenPDF/"
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm"
                    />
                    <button
                      type="button"
                      disabled={verifyingUrl || !payload.trim()}
                      onClick={handleVerifyUrl}
                      className="px-4 py-3 rounded-xl text-xs font-bold border border-gray-200 dark:border-slate-700 hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
                    >
                      {verifyingUrl ? 'Comprobando...' : 'Probar URL en línea'}
                    </button>
                  </div>
                </div>

                {urlCheck && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      urlCheck.reachable
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {urlCheck.reachable ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">
                        {urlCheck.reachable
                          ? `URL activa y verificada (HTTP ${urlCheck.status_code} · ${urlCheck.elapsed_ms} ms)`
                          : `Fallo al verificar URL: ${urlCheck.error}`}
                      </p>
                      {urlCheck.title && <p className="mt-0.5">Título: {urlCheck.title}</p>}
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifyOnline}
                    onChange={(e) => setVerifyOnline(e.target.checked)}
                    className="mt-0.5 accent-brand"
                  />
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      Verificar que la URL responda en línea antes de estampar el QR
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Impide estampar códigos QR con enlaces rotos o caídos (desactívalo si estás
                      sin conexión o deseas codificar texto libre).
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                    Etiqueta inferior bajo el QR (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={labelText}
                    onChange={(e) => setLabelText(e.target.value)}
                    placeholder="Ej. Escanear para verificar autenticidad"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs sm:text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 space-y-5 shadow-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Escáner y Auditor de Códigos QR del Documento
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Detecta códigos QR en todas las páginas usando visión artificial local y
                      comprueba en línea si sus enlaces funcionan.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={inspecting}
                    onClick={handleInspectPdf}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs sm:text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {inspecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>{inspecting ? 'Escaneando páginas...' : 'Escanear QR en PDF'}</span>
                  </button>
                </div>

                {inspectResult && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      Páginas analizadas: {inspectResult.page_count} · Códigos QR detectados:{' '}
                      {inspectResult.qr_count}
                    </p>

                    {inspectResult.items.length === 0 ? (
                      <div className="p-6 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-center text-sm text-gray-500">
                        No se encontraron códigos QR en las páginas de este PDF.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {inspectResult.items.map((item, idx) => (
                          <div
                            key={`${item.page}-${idx}`}
                            className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-brand/10 text-brand">
                                Página {item.page}
                              </span>
                              <p className="text-sm font-mono font-semibold text-gray-900 dark:text-white break-all">
                                {item.data}
                              </p>
                              {item.online_check && (
                                <p
                                  className={`text-xs font-medium ${
                                    item.online_check.reachable
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {item.online_check.reachable
                                    ? `Enlace activo (HTTP ${item.online_check.status_code} · ${item.online_check.elapsed_ms} ms)`
                                    : `Enlace caído o inaccesible: ${item.online_check.error}`}
                                </p>
                              )}
                            </div>

                            {item.is_url && (
                              <a
                                href={
                                  item.data.startsWith('http') ? item.data : `https://${item.data}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline shrink-0"
                              >
                                Abrir enlace
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Posición del QR</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                Páginas donde estampar
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'first', label: 'Primera página' },
                  { id: 'last', label: 'Última página' },
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
                Ubicación en página
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
                <span>Tamaño del QR</span>
                <span className="text-brand">{scalePct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={32}
                value={scalePct}
                onChange={(e) => setScalePct(Number(e.target.value))}
                className="w-full accent-brand"
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
              <button
                type="button"
                onClick={cancel}
                className="w-full py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancelar ({uploadProgress}%)
              </button>
            )}

            <button
              type="button"
              disabled={isProcessing || activeTab !== 'stamp'}
              onClick={handleStampSubmit}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <QrCode size={18} />
              )}
              <span>{isProcessing ? processStatus || 'Estampando QR...' : 'Estampar Código QR'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
