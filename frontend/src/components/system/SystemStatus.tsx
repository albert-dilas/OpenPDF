'use client';

import { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  X,
  ExternalLink,
  Cpu,
  Blocks,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSystemStore } from '@/store/useSystemStore';

let pollerInitialized = false;

export function SystemStatusPoller() {
  const checkStatus = useSystemStore((s) => s.checkStatus);
  const checkUpdatesOnce = useSystemStore((s) => s.checkUpdatesOnce);

  useEffect(() => {
    if (!pollerInitialized) {
      pollerInitialized = true;
      checkStatus();
      checkUpdatesOnce();
    }
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);
    return () => {
      clearInterval(interval);
      pollerInitialized = false;
    };
  }, [checkStatus, checkUpdatesOnce]);

  return null;
}

export function SystemStatusBadge() {
  const {
    online,
    checking,
    hasCheckedOnce,
    version,
    capabilities,
    maxFileSizeMb,
    checkStatus,
    setModulesModalOpen,
  } = useSystemStore();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const isOffline = hasCheckedOnce && !online;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          isOffline
            ? 'Estado del sistema: Motor local desconectado'
            : 'Estado del sistema: Motor local activo'
        }
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
          isOffline
            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {!isOffline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOffline ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </span>
        <span className="hidden sm:inline">
          {checking && !hasCheckedOnce
            ? 'Verificando motor...'
            : isOffline
            ? 'Motor Desconectado'
            : 'Motor Local Activo'}
        </span>
        <span className="sm:hidden">{isOffline ? 'Offline' : 'Local'}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Detalles del motor local"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xl p-4 z-50 text-left animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                Motor OpenPDF v{version}
              </span>
            </div>
            <button
              type="button"
              onClick={() => checkStatus()}
              title="Actualizar estado"
              aria-label="Actualizar estado del motor"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isOffline ? (
            <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/60">
              <p className="font-semibold">No hay conexión con el servidor local.</p>
              <p className="text-amber-600 dark:text-amber-400">
                Asegúrate de que el proceso de OpenPDF (FastAPI) esté activo en tu equipo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                <span>Procesamiento</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  100% En tu equipo
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                <span>Límite por archivo</span>
                <span className="font-semibold text-gray-900 dark:text-slate-200">
                  {maxFileSizeMb} MB
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Módulos opcionales
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-slate-300">OCR (Tesseract)</span>
                  {capabilities.ocr ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-slate-300">Word a PDF</span>
                  {capabilities.word_to_pdf ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setModulesModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand/10 hover:bg-brand/15 text-brand dark:bg-brand/20 dark:text-red-300 font-bold text-xs transition-colors"
                >
                  <Blocks className="w-3.5 h-3.5" />
                  <span>Gestionar e instalar módulos opcionales</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UpdateBanner() {
  const { updateInfo, updateDismissed, dismissUpdate } = useSystemStore();

  if (!updateInfo || !updateInfo.update_available || !updateInfo.online || updateDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-gradient-to-r from-brand-dark via-brand to-orange-600 text-white px-4 py-2 text-xs sm:text-sm shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            Nueva versión de <strong>OpenPDF {updateInfo.latest}</strong> disponible (actual:{' '}
            {updateInfo.current}).
          </span>
          {updateInfo.url && (
            <a
              href={updateInfo.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline font-semibold hover:opacity-90 ml-1"
            >
              Ver descarga <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={dismissUpdate}
          aria-label="Descartar aviso de actualización"
          className="p-1 rounded-lg hover:bg-white/15 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function CapabilityWarningBanner({
  capability,
}: {
  capability?: 'ocr' | 'word_to_pdf';
}) {
  const {
    hasCheckedOnce,
    online,
    capabilities,
    checking,
    setModulesModalOpen,
    detectModules,
  } = useSystemStore();

  if (!capability || !hasCheckedOnce || !online) return null;
  if (capabilities[capability]) return null;

  const isOcr = capability === 'ocr';

  const handleQuickDetect = async () => {
    const res = await detectModules();
    if (res?.capabilities?.[capability]) {
      toast.success('Módulo detectado y conectado automáticamente.');
    } else {
      toast('No se detectó en las rutas estándar. Puedes instalarlo en 1 clic.', {
        duration: 3500,
      });
    }
  };

  return (
    <div
      role="alert"
      className="max-w-3xl mx-auto mb-6 rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/90 dark:bg-amber-950/40 px-5 py-4 text-left shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold">
              {isOcr
                ? 'Módulo Tesseract OCR pendiente de conectar'
                : 'Módulo Word / LibreOffice pendiente de conectar'}
            </p>
            <p className="text-amber-700 dark:text-amber-300/90 leading-relaxed">
              {isOcr
                ? 'Puedes instalarlo automáticamente en 1 clic o vincularlo desde aquí sin abrir consolas ni configurar variables de entorno.'
                : 'Puedes instalar LibreOffice automáticamente en 1 clic o autodetectar Microsoft Word / LibreOffice sin salir de esta ventana.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pl-2">
          <button
            type="button"
            onClick={() => setModulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Blocks className="w-3.5 h-3.5" />
            <span>Instalar o conectar en 1 clic</span>
          </button>
          <button
            type="button"
            disabled={checking}
            onClick={handleQuickDetect}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Autodetectar ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
}
