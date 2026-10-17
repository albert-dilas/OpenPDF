'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import Uploader from '@/components/pdf/Uploader';
import SaveDialog from '@/components/pdf/SaveDialog';
import { useToolProcessor } from '@/hooks/useToolProcessor';
import { formatBytes } from '@/lib/api';
import {
  ArrowLeft,
  EyeOff,
  Trash2,
  Settings2,
  Loader2,
  AlertCircle,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RedactPDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [terms, setTerms] = useState<string>('');
  const [redactEmails, setRedactEmails] = useState<boolean>(true);
  const [redactPhones, setRedactPhones] = useState<boolean>(false);
  const [redactIds, setRedactIds] = useState<boolean>(false);
  const [redactUrls, setRedactUrls] = useState<boolean>(false);
  const [fillColor, setFillColor] = useState<'black' | 'white'>('black');
  const [lastRedactedCount, setLastRedactedCount] = useState<number | null>(null);

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

  const handleRedactSubmit = async () => {
    if (!files[0]) return;
    const hasCriteria =
      terms.trim().length > 0 || redactEmails || redactPhones || redactIds || redactUrls;
    if (!hasCriteria) {
      toast.error('Ingresa al menos un término o activa un patrón automático de censura.');
      return;
    }

    setLastRedactedCount(null);
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('terms', terms);
    formData.append('redact_emails', String(redactEmails));
    formData.append('redact_phones', String(redactPhones));
    formData.append('redact_ids', String(redactIds));
    formData.append('redact_urls', String(redactUrls));
    formData.append('fill_color', fillColor);

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/redact/',
      formData,
      fallbackFileName: `${baseName}_censurado.pdf`,
      getSuccessMessage: (headers) => {
        const count = Number(headers['x-redacted-count'] || '0');
        setLastRedactedCount(count);
        return `Se eliminaron permanentemente ${count} coincidencias del documento.`;
      },
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
            Censurar y Redactar PDF
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Purga de forma física e irreversible nombres, montos, correos electrónicos, teléfonos o
            identificadores confidenciales en todas las páginas de tu PDF.
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
                  Censurar / Redactar PDF
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

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5" />
                Purga Irreversible
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 space-y-5 shadow-card">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1.5">
                  Palabras, nombres o códigos confidenciales a eliminar
                </label>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                  Escribe uno o varios términos separados por coma o salto de línea. Se eliminarán
                  físicamente del flujo interno del PDF (no podrán copiarse ni seleccionarse).
                </p>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Ej. Juan Pérez, RUC 20123456789, CONFIDENCIAL-2026"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  Detección automática de datos sensibles (Patrones)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'emails',
                      checked: redactEmails,
                      set: setRedactEmails,
                      title: 'Correos electrónicos',
                      desc: 'Ej. usuario@dominio.com',
                    },
                    {
                      id: 'phones',
                      checked: redactPhones,
                      set: setRedactPhones,
                      title: 'Números telefónicos',
                      desc: 'Teléfonos móviles y fijos con o sin prefijo',
                    },
                    {
                      id: 'ids',
                      checked: redactIds,
                      set: setRedactIds,
                      title: 'DNI / RUC / Tarjetas (8+ dígitos)',
                      desc: 'Secuencias numéricas de identificación o cuentas',
                    },
                    {
                      id: 'urls',
                      checked: redactUrls,
                      set: setRedactUrls,
                      title: 'Enlaces y URLs web',
                      desc: 'Direcciones http://, https:// y www.',
                    },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        item.checked
                          ? 'border-brand bg-red-50/40 dark:bg-brand/10'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.set(e.target.checked)}
                        className="mt-1 accent-brand"
                      />
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Estilo de Censura</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                Apariencia del área censurada
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFillColor('black')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fillColor === 'black'
                      ? 'border-brand bg-red-50/60 dark:bg-brand/15 text-brand dark:text-red-400 font-bold'
                      : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block w-8 h-3 bg-gray-950 rounded mb-1.5" />
                  <span className="text-xs">Bloque Negro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFillColor('white')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fillColor === 'white'
                      ? 'border-brand bg-red-50/60 dark:bg-brand/15 text-brand dark:text-red-400 font-bold'
                      : 'border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block w-8 h-3 bg-white border border-gray-300 rounded mb-1.5" />
                  <span className="text-xs">Espacio Blanco</span>
                </button>
              </div>
            </div>

            {lastRedactedCount !== null && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Elementos purgados en la última ejecución: <strong>{lastRedactedCount}</strong>
                </span>
              </div>
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
              disabled={isProcessing}
              onClick={handleRedactSubmit}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <EyeOff size={18} />
              )}
              <span>{isProcessing ? processStatus || 'Censurando...' : 'Censurar PDF'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
