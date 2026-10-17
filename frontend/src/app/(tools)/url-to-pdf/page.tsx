'use client';

import { useState } from 'react';
import Link from 'next/link';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { apiClient, extractErrorMessage, QrVerifyUrlResponse } from '@/lib/api';
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  FileText,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UrlToPDFPage() {
  const [url, setUrl] = useState<string>('');
  const [mode, setMode] = useState<'reader' | 'full'>('reader');
  const [pageSize, setPageSize] = useState<'a4' | 'letter'>('a4');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [urlCheck, setUrlCheck] = useState<QrVerifyUrlResponse | null>(null);

  const {
    isProcessing,
    processStatus,
    error,
    pendingBlob,
    defaultFileName,
    process,
    cancel,
    handleSave,
    dismissSave,
  } = useToolProcessor();

  const handleVerifyUrl = async () => {
    if (!url.trim()) {
      toast.error('Ingresa una URL para verificar.');
      return;
    }
    setVerifying(true);
    setUrlCheck(null);
    const formData = new FormData();
    formData.append('url', url.trim());

    try {
      const { data } = await apiClient.post<QrVerifyUrlResponse>('/qr/verify-url', formData);
      setUrlCheck(data);
      if (data.reachable) {
        toast.success(`URL verificada (${data.status_code} · ${data.elapsed_ms} ms)`);
      } else {
        toast.error(data.error || 'La URL no respondió satisfactoriamente.');
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo verificar la URL.');
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleConvertSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!url.trim()) {
      toast.error('Ingresa una dirección web (URL) válida.');
      return;
    }

    const formData = new FormData();
    formData.append('url', url.trim());
    formData.append('mode', mode);
    formData.append('page_size', pageSize);

    await process({
      endpoint: '/url-to-pdf/',
      formData,
      fallbackFileName: 'captura_web.pdf',
    });
  };

  return (
    <>
      {pendingBlob && (
        <SaveDialog
          defaultName={defaultFileName || 'captura_web.pdf'}
          blobSize={pendingBlob.size}
          onConfirm={(fileName) => handleSave(fileName)}
          onCancel={dismissSave}
        />
      )}

      <div className="flex-grow py-10 sm:py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Todas las herramientas
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800">
              <Globe className="w-3.5 h-3.5" />
              Requiere conexión a Internet
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
              Web / URL a PDF
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              Captura cualquier artículo, documentación técnica o página web pública desde una URL y
              conviértela en un documento PDF limpio y estructurado (con protección anti-SSRF).
            </p>
          </div>

          <form
            onSubmit={handleConvertSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-card space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Dirección URL de la página web o documento PDF remoto
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://es.wikipedia.org/wiki/Portable_Document_Format"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  disabled={verifying || isProcessing || !url.trim()}
                  onClick={handleVerifyUrl}
                  className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:border-brand hover:text-brand transition-colors disabled:opacity-50 shrink-0"
                >
                  {verifying ? 'Verificando...' : 'Verificar URL'}
                </button>
              </div>
            </div>

            {urlCheck && (
              <div
                className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
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
                <div className="space-y-1 min-w-0">
                  <p className="font-bold">
                    {urlCheck.reachable
                      ? `Conexión exitosa (HTTP ${urlCheck.status_code} · ${urlCheck.elapsed_ms} ms)`
                      : `No accesible: ${urlCheck.error || 'Error de conexión'}`}
                  </p>
                  {urlCheck.title && <p className="truncate">Título: {urlCheck.title}</p>}
                  {urlCheck.content_type && <p>Tipo de contenido: {urlCheck.content_type}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                  Modo de extracción
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode('reader')}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      mode === 'reader'
                        ? 'border-brand bg-red-50/60 dark:bg-brand/15'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        Modo Lectura Limpia
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Extrae el artículo principal omitiendo menús, barras laterales y anuncios.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('full')}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      mode === 'full'
                        ? 'border-brand bg-red-50/60 dark:bg-brand/15'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        Página Completa
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Conserva todas las secciones textuales y tablas de la página.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                  Formato de hoja
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'a4', name: 'ISO A4 (210 × 297 mm)', desc: 'Estándar internacional' },
                    { id: 'letter', name: 'Carta / Letter (8.5 × 11 in)', desc: 'Estándar Norteamérica' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setPageSize(sz.id as 'a4' | 'letter')}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                        pageSize === sz.id
                          ? 'border-brand bg-red-50/60 dark:bg-brand/15'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                        {sz.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{sz.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
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

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {isProcessing && (
                <button
                  type="button"
                  onClick={cancel}
                  className="px-5 py-3.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs sm:text-sm font-semibold"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isProcessing || !url.trim()}
                className="flex-1 bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Sparkles size={18} />
                )}
                <span>
                  {isProcessing ? processStatus || 'Capturando URL...' : 'Convertir URL a PDF'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
