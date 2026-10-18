'use client';

import {
  X,
  CheckCircle2,
  Download,
  Loader2,
  WifiOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { SystemUpdateResponse } from '@/lib/api';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  updateData: SystemUpdateResponse | null;
  onCheckAgain: () => void;
}

export default function UpdateModal({
  isOpen,
  onClose,
  isLoading,
  updateData,
  onCheckAgain,
}: UpdateModalProps) {
  if (!isOpen) return null;

  const isUpToDate =
    !isLoading &&
    updateData !== null &&
    updateData.online &&
    !updateData.update_available;

  const isUpdateAvailable =
    !isLoading &&
    updateData !== null &&
    updateData.online &&
    updateData.update_available;

  const isOffline =
    !isLoading &&
    (updateData === null || !updateData.online);

  const releaseUrl =
    updateData?.download_url ||
    updateData?.url ||
    'https://github.com/albert-dilas/OpenPDF/releases';

  const handleUpdateClick = () => {
    if (typeof window !== 'undefined') {
      window.open(releaseUrl, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-brand/10 text-brand">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'transition-transform duration-300 hover:rotate-180'}`} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Comprobador de Actualizaciones
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar diálogo"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3
                  id="update-modal-title"
                  className="text-base font-bold text-gray-900 dark:text-white"
                >
                  Buscando actualizaciones en tiempo real...
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                  Consultando la API oficial de GitHub Releases para verificar si existe una nueva versión compilada.
                </p>
              </div>
            </div>
          ) : isUpToDate ? (
            <div className="py-3 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    No necesita actualización
                  </div>
                  <h3
                    id="update-modal-title"
                    className="text-lg font-bold text-gray-900 dark:text-white"
                  >
                    Tu versión no necesita actualización
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    Tienes instalada la versión más reciente disponible (v{updateData?.current}). Todo el motor local está al día y no requiere ninguna descarga o actualización adicional.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800/90 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Versión instalada:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-slate-200">
                    v{updateData?.current}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Última versión en GitHub:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    v{updateData?.latest || updateData?.current}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Estado de verificación:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Comprobado en tiempo real (Al día)
                  </span>
                </div>
              </div>
            </div>
          ) : isUpdateAvailable ? (
            <div className="py-3 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    Nueva Versión Disponible
                  </div>
                  <h3
                    id="update-modal-title"
                    className="text-lg font-bold text-gray-900 dark:text-white"
                  >
                    Actualización disponible: v{updateData?.latest}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    Se ha publicado una versión más reciente de OpenPDF en GitHub. Pulsa en <strong>Actualizar</strong> para descargar la nueva versión oficial o <strong>Cancelar</strong> para continuar con la versión actual.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-gray-200/80 dark:border-slate-800/90 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Versión actualmente instalada:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-slate-300">
                    v{updateData?.current}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Nueva versión disponible:</span>
                  <span className="font-mono font-bold text-brand text-sm">
                    v{updateData?.latest}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600 dark:text-slate-400">
                  <span>Canal de distribución:</span>
                  <span className="font-medium text-gray-900 dark:text-slate-200">
                    GitHub Releases (Binarios oficiales)
                  </span>
                </div>
              </div>

              {updateData?.notes && (
                <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Novedades de la versión:
                  </span>
                  <div className="text-xs text-gray-700 dark:text-slate-300 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed pr-1 font-mono text-[11px]">
                    {updateData.notes}
                  </div>
                </div>
              )}
            </div>
          ) : isOffline ? (
            <div className="py-3 space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3
                    id="update-modal-title"
                    className="text-lg font-bold text-gray-900 dark:text-white"
                  >
                    Sin conexión con GitHub
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    No fue posible conectar con los servidores de GitHub en este momento. OpenPDF sigue funcionando con total privacidad y normalidad en modo local-first.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 p-4 text-xs text-amber-900 dark:text-amber-200">
                Puedes verificar tu conexión de red o consultar manualmente la página de descargas cuando tengas acceso a internet.
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-950/80 border-t border-gray-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCheckAgain}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Volver a comprobar</span>
          </button>

          <div className="flex items-center gap-2">
            {isUpdateAvailable ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateClick}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold shadow-md shadow-brand/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Actualizar</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
