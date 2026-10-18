'use client';

import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  FolderOpen,
  Loader2,
  ScanText,
  FileOutput,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemStore } from '@/store/useSystemStore';
import { extractErrorMessage, ModuleStatusInfo } from '@/lib/api';

function formatEngineLabel(engine: string | null | undefined, moduleKey: 'ocr' | 'word_to_pdf'): string {
  if (engine === 'tesseract') return 'Tesseract OCR';
  if (engine === 'msword') return 'Microsoft Word Nativo (COM)';
  if (engine === 'libreoffice') return 'LibreOffice Headless';
  return moduleKey === 'ocr' ? 'Tesseract OCR' : 'Motor Word / LibreOffice';
}

export default function ModulesModal() {
  const {
    modulesModalOpen,
    setModulesModalOpen,
    modules,
    capabilities,
    ocrLanguages,
    checking,
    detectModules,
    configureModule,
    pickModuleBinary,
    installModule,
  } = useSystemStore();

  const [manualOcrOpen, setManualOcrOpen] = useState(false);
  const [manualWordOpen, setManualWordOpen] = useState(false);
  const [ocrCustomPath, setOcrCustomPath] = useState('');
  const [wordCustomPath, setWordCustomPath] = useState('');
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modulesModalOpen) {
        setModulesModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modulesModalOpen, setModulesModalOpen]);

  if (!modulesModalOpen) return null;

  const ocrInfo: ModuleStatusInfo = modules?.ocr ?? {
    available: capabilities.ocr,
    engine: capabilities.ocr ? 'tesseract' : null,
    binary_path: null,
    source: capabilities.ocr ? 'auto' : 'none',
    languages: ocrLanguages,
    has_spanish: ocrLanguages.includes('spa'),
    install_status: 'idle',
    install_message: null,
  };

  const wordInfo: ModuleStatusInfo = modules?.word_to_pdf ?? {
    available: capabilities.word_to_pdf,
    engine: capabilities.word_to_pdf ? 'libreoffice' : null,
    binary_path: null,
    source: capabilities.word_to_pdf ? 'auto' : 'none',
    install_status: 'idle',
    install_message: null,
  };

  const handleAutoDetect = async () => {
    setBusyAction('detect');
    try {
      const res = await detectModules();
      if (res) {
        toast.success('Escaneo del sistema completado.');
      } else {
        toast.error('No se pudo conectar con el motor local para escanear.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handlePickBinary = async (mod: 'ocr' | 'word_to_pdf') => {
    setBusyAction(`pick-${mod}`);
    try {
      const res = await pickModuleBinary(mod);
      if (res.selected) {
        toast.success('Ejecutable vinculado y verificado correctamente.');
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo vincular el ejecutable seleccionado.');
      toast.error(msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleManualConfigure = async (mod: 'ocr' | 'word_to_pdf', pathValue: string) => {
    setBusyAction(`config-${mod}`);
    try {
      await configureModule(mod, pathValue.trim());
      toast.success(
        pathValue.trim()
          ? 'Ruta vinculada y verificada correctamente.'
          : 'Configuración restablecida a detección automática.'
      );
      if (mod === 'ocr') setOcrCustomPath('');
      if (mod === 'word_to_pdf') setWordCustomPath('');
    } catch (err) {
      const msg = await extractErrorMessage(err, 'La ruta indicada no contiene un ejecutable válido.');
      toast.error(msg);
    } finally {
      setBusyAction(null);
    }
  };

  const handleOneClickInstall = async (mod: 'ocr' | 'word_to_pdf' | 'ocr_lang_spa') => {
    setBusyAction(`install-${mod}`);
    try {
      await installModule(mod);
      toast.success('Instalación desatendida iniciada en segundo plano.');
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo iniciar la instalación automática.');
      toast.error(msg);
    } finally {
      setBusyAction(null);
    }
  };

  const renderModuleCard = (
    moduleKey: 'ocr' | 'word_to_pdf',
    title: string,
    subtitle: string,
    info: ModuleStatusInfo,
    manualOpen: boolean,
    setManualOpen: (v: boolean) => void,
    customPath: string,
    setCustomPath: (v: string) => void,
    placeholderPath: string
  ) => {
    const isOcr = moduleKey === 'ocr';
    const isInstalling = info.install_status === 'installing';
    const isFailed = info.install_status === 'failed';

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-5 space-y-4">
        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ring-1 ring-inset ring-white/20 ${
                isOcr
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-700'
                  : 'bg-gradient-to-br from-blue-600 to-slate-800'
              }`}
            >
              {isOcr ? <ScanText className="w-5 h-5" /> : <FileOutput className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          {info.available ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conectado y listo
            </span>
          ) : isInstalling ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Instalando...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pendiente de activar
            </span>
          )}
        </div>

        {/* Live Installation Progress Banner */}
        {(isInstalling || (info.install_message && info.install_status !== 'idle')) && (
          <div
            className={`rounded-xl p-3.5 text-xs border flex items-start gap-2.5 ${
              isInstalling
                ? 'bg-blue-50/90 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800/70 dark:text-blue-200'
                : isFailed
                ? 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/70 dark:text-red-200'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/70 dark:text-emerald-200'
            }`}
          >
            {isInstalling ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            ) : isFailed ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <div className="space-y-1 flex-1">
              <p className="font-bold">
                {isInstalling
                  ? 'Instalando y conectando automáticamente...'
                  : isFailed
                  ? 'Aviso de instalación'
                  : 'Proceso completado'}
              </p>
              {info.install_message && (
                <p className="opacity-90 leading-relaxed">{info.install_message}</p>
              )}
            </div>
          </div>
        )}

        {/* Active State Details */}
        {info.available ? (
          <div className="rounded-xl bg-white dark:bg-slate-950/70 border border-gray-200/80 dark:border-slate-800/90 p-3.5 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-500 dark:text-slate-400 font-medium">Motor activo:</span>
              <span className="font-bold text-gray-900 dark:text-slate-100">
                {formatEngineLabel(info.engine, moduleKey)}
              </span>
            </div>

            {info.binary_path && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                <span className="text-gray-500 dark:text-slate-400 font-medium shrink-0">
                  Ruta vinculada:
                </span>
                <code className="font-mono text-[11px] text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-900 px-2 py-0.5 rounded truncate max-w-full">
                  {info.binary_path}
                </code>
              </div>
            )}

            {isOcr && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                <span className="text-gray-500 dark:text-slate-400 font-medium">
                  Idiomas OCR detectados:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-gray-800 dark:text-slate-200">
                    {(info.languages && info.languages.length > 0
                      ? info.languages
                      : ocrLanguages
                    ).join(', ')}
                  </span>
                  {info.has_spanish === false && (
                    <button
                      type="button"
                      disabled={isInstalling || busyAction !== null}
                      onClick={() => handleOneClickInstall('ocr_lang_spa')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand text-white font-semibold text-[11px] hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      Instalar idioma Español (1 clic)
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(!manualOpen)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${manualOpen ? 'rotate-180' : ''}`}
                />
                Cambiar ejecutable manualmente
              </button>

              {info.source === 'custom' && (
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => handleManualConfigure(moduleKey, '')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer detección automática
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Guided 3-Option Setup for Non-Technical Users */
          <div className="space-y-3">
            {/* Option A: 1-Click Automatic Install */}
            <div className="rounded-xl bg-white dark:bg-slate-950/80 border border-brand/30 dark:border-brand/40 p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                  Opción A (Recomendada) — Instalación Automática en 1 Clic
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand/10 text-brand dark:bg-brand/20 dark:text-red-300">
                  Sin consola ni PATH
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                {isOcr
                  ? 'OpenPDF descargará e instalará Tesseract OCR junto con los idiomas Español e Inglés y lo conectará automáticamente.'
                  : 'OpenPDF descargará e instalará LibreOffice de forma desatendida y lo vinculará automáticamente para convertir documentos Word.'}
              </p>
              <button
                type="button"
                disabled={isInstalling || busyAction !== null}
                onClick={() => handleOneClickInstall(moduleKey)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {isInstalling || busyAction === `install-${moduleKey}` ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>
                  {isInstalling
                    ? 'Instalando y conectando automáticamente...'
                    : 'Instalar automáticamente ahora'}
                </span>
              </button>
            </div>

            {/* Option B & Option C Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option B */}
              <div className="rounded-xl bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 p-3.5 flex flex-col justify-between gap-2.5">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Opción B — Ya lo tengo instalado
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Escanea automáticamente todas las carpetas y el Registro de Windows.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={checking || busyAction !== null}
                  onClick={handleAutoDetect}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold text-gray-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  {busyAction === 'detect' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>Autodetectar en mi PC</span>
                </button>
              </div>

              {/* Option C */}
              <div className="rounded-xl bg-white dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 p-3.5 flex flex-col justify-between gap-2.5">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Opción C — Vincular archivo .exe
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Elige el ejecutable desde una carpeta personalizada o versión portable.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => handlePickBinary(moduleKey)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-semibold text-gray-800 dark:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    {busyAction === `pick-${moduleKey}` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderOpen className="w-3.5 h-3.5" />
                    )}
                    <span>Seleccionar archivo .exe...</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualOpen(!manualOpen)}
                    title="Escribir o pegar ruta manualmente"
                    aria-label="Escribir o pegar ruta manualmente"
                    className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${manualOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Manual Path Input */}
        {manualOpen && (
          <div className="rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 p-3.5 space-y-2 animate-fade-in">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Ruta de carpeta o archivo ejecutable (.exe)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder={placeholderPath}
                className="flex-1 rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                disabled={!customPath.trim() || busyAction !== null}
                onClick={() => handleManualConfigure(moduleKey, customPath)}
                className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Vincular
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modules-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setModulesModalOpen(false);
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-brand/15 text-brand">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="modules-modal-title"
                className="text-lg font-extrabold text-gray-900 dark:text-white"
              >
                Centro de Módulos Opcionales
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Conecta o instala en 1 clic los motores locales sin abrir consolas ni configurar variables del sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModulesModalOpen(false)}
            aria-label="Cerrar ventana de módulos"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {renderModuleCard(
            'ocr',
            '1. Reconocimiento Óptico de Caracteres (Tesseract OCR)',
            'Necesario para la herramienta OCR PDF (convertir documentos escaneados en texto buscable).',
            ocrInfo,
            manualOcrOpen,
            setManualOcrOpen,
            ocrCustomPath,
            setOcrCustomPath,
            'Ej. C:\\Program Files\\Tesseract-OCR\\tesseract.exe'
          )}

          {renderModuleCard(
            'word_to_pdf',
            '2. Conversión de Word a PDF (Microsoft Word / LibreOffice)',
            'Necesario para convertir archivos .docx y .doc a PDF conservando el diseño original.',
            wordInfo,
            manualWordOpen,
            setManualWordOpen,
            wordCustomPath,
            setWordCustomPath,
            'Ej. C:\\Program Files\\LibreOffice\\program\\soffice.exe'
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-950/80 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={checking || busyAction !== null}
            onClick={handleAutoDetect}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5 text-brand" />
            <span>Re-escanear sistema ahora</span>
          </button>

          <button
            type="button"
            onClick={() => setModulesModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
