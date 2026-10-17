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
  Languages,
  Globe,
  Trash2,
  Settings2,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const SOURCE_LANGS = [
  { id: 'auto', label: 'Detectar idioma automáticamente' },
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'Inglés' },
  { id: 'pt', label: 'Portugués' },
  { id: 'fr', label: 'Francés' },
  { id: 'de', label: 'Alemán' },
  { id: 'it', label: 'Italiano' },
];

const TARGET_LANGS = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'Inglés' },
  { id: 'pt', label: 'Portugués' },
  { id: 'fr', label: 'Francés' },
  { id: 'de', label: 'Alemán' },
  { id: 'it', label: 'Italiano' },
];

export default function TranslatePDFPage() {
  const { files, addFiles, clearFiles } = useFileStore();
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [mode, setMode] = useState<'translated' | 'bilingual'>('translated');

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

  const handleTranslateSubmit = async () => {
    if (!files[0]) return;
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      toast.error('Selecciona un idioma de destino distinto al de origen.');
      return;
    }

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);
    formData.append('mode', mode);

    const baseName = files[0].name.replace(/\.[^.]+$/, '');
    await process({
      endpoint: '/translate/',
      formData,
      fallbackFileName: `${baseName}_${targetLang}.pdf`,
      getSuccessMessage: (headers) => {
        const pages = headers['x-translated-pages'] || '1';
        return `Se tradujeron ${pages} páginas con éxito.`;
      },
    });
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
              Online
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            Traducir PDF (Online)
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
            Extrae y traduce los bloques de texto de tu documento PDF a múltiples idiomas generando
            un nuevo documento PDF estructurado o una edición bilingüe.
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
                  Traducir PDF (Online)
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
                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
                <Globe className="w-3.5 h-3.5" />
                Servicio Online
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 space-y-6 shadow-card">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                    Idioma del documento original
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-semibold"
                  >
                    {SOURCE_LANGS.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                    Idioma de destino
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-semibold"
                  >
                    {TARGET_LANGS.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
                  Formato de salida del documento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('translated')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      mode === 'translated'
                        ? 'border-brand bg-red-50/50 dark:bg-brand/15'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Solo texto traducido
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Genera un PDF limpio únicamente en el idioma de destino seleccionado.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('bilingual')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      mode === 'bilingual'
                        ? 'border-brand bg-red-50/50 dark:bg-brand/15'
                        : 'border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Edición Bilingüe (Original + Traducción)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Intercala los párrafos originales en cursiva junto a su traducción.
                    </p>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/70 text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
                <strong>Aviso de transparencia:</strong> La extracción y el ensamblado del PDF se
                ejecutan en tu máquina local, pero los fragmentos de texto extraídos se envían al
                motor de traducción en línea para obtener la traducción.
              </div>
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-800 shadow-xl flex flex-col shrink-0">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="text-brand w-5 h-5" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resumen</h2>
          </div>

          <div className="p-5 sm:p-6 flex-1 space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/70 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Idioma origen</span>
                <span className="font-bold">
                  {SOURCE_LANGS.find((l) => l.id === sourceLang)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Idioma destino</span>
                <span className="font-bold text-brand">
                  {TARGET_LANGS.find((l) => l.id === targetLang)?.label}
                </span>
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
              onClick={handleTranslateSubmit}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-gray-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/20 text-base transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Languages size={18} />
              )}
              <span>{isProcessing ? processStatus || 'Traduciendo...' : 'Traducir PDF'}</span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
