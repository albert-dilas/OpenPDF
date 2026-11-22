'use client';

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Download,
  Loader2,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBytes } from '@/lib/api';
import { isMutationPending, isResourceBusy, MutationState } from '@/lib/fsm';
import {
  selectUpdateInfo,
  useSystemStore,
} from '@/store/useSystemStore';
import { AsyncButton, ProgressBar } from '@/components/ui/Loaders';
import { useI18n } from '@/i18n';

interface UpdateModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCheckAgain?: () => void;
}

export default function UpdateModal({
  isOpen: controlledOpen,
  onClose: controlledClose,
  onCheckAgain,
}: UpdateModalProps) {
  const { locale, t } = useI18n();
  const storeOpen = useSystemStore((s) => s.updateModalOpen);
  const setStoreOpen = useSystemStore((s) => s.setUpdateModalOpen);
  const updateState = useSystemStore((s) => s.updateState);
  const updateData = useSystemStore(selectUpdateInfo);
  const selfUpdate = useSystemStore((s) => s.selfUpdateStatus);
  const checkForUpdatesRealtime = useSystemStore((s) => s.checkForUpdatesRealtime);
  const beginSelfUpdateDownload = useSystemStore((s) => s.beginSelfUpdateDownload);
  const cancelSelfUpdate = useSystemStore((s) => s.cancelSelfUpdate);
  const applyVerifiedUpdate = useSystemStore((s) => s.applyVerifiedUpdate);

  const [applyMutation, setApplyMutation] = useState<MutationState>({ status: 'idle' });

  const open = controlledOpen ?? storeOpen;
  if (!open) return null;

  const isEn = locale === 'en';
  const closeHandler = controlledClose ?? (() => setStoreOpen(false));
  const retryCheckHandler = onCheckAgain ?? (() => checkForUpdatesRealtime());

  const queryBusy = isResourceBusy(updateState);
  const dlBusy =
    selfUpdate.status === 'downloading' || selfUpdate.status === 'verifying';
  const applyBusy = isMutationPending(applyMutation);
  const modalLocked = queryBusy || applyBusy;

  const isUpToDate =
    !queryBusy &&
    updateData !== null &&
    updateData.online &&
    !updateData.update_available &&
    selfUpdate.status !== 'ready_to_install';

  const isUpdateAvailable =
    !queryBusy &&
    ((updateData !== null && updateData.online && updateData.update_available) ||
      selfUpdate.status === 'downloading' ||
      selfUpdate.status === 'verifying' ||
      selfUpdate.status === 'ready_to_install');

  const isOffline =
    !queryBusy &&
    !isUpdateAvailable &&
    (updateData === null || !updateData.online);

  const canSelfDownload = Boolean(
    updateData?.latest &&
      (updateData?.installer_url || updateData?.portable_url || updateData?.download_url) &&
      updateData?.checksums_url
  );

  const releaseUrl =
    updateData?.url ||
    updateData?.download_url ||
    'https://github.com/albert-dilas/Tornio/releases';

  const handleStartInAppDownload = async () => {
    try {
      const started = await beginSelfUpdateDownload();
      if (!started) {
        window.open(releaseUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      toast.error(
        isEn
          ? 'Unable to start verified download from GitHub Releases.'
          : 'No se pudo iniciar la descarga verificada desde GitHub Releases.'
      );
    }
  };

  const handleApplyNow = async () => {
    setApplyMutation({ status: 'pending' });
    try {
      const res = await applyVerifiedUpdate();
      setApplyMutation({ status: 'success', data: undefined });
      toast.success(
        res.dry_run
          ? 'Dry-run OK.'
          : isEn
          ? 'Launching verified installer and closing Tornio...'
          : 'Ejecutando instalador verificado y cerrando Tornio...'
      );
    } catch {
      setApplyMutation({ status: 'error', error: 'apply_failed' });
      toast.error(
        isEn
          ? 'Unable to apply update package.'
          : 'No se pudo aplicar el paquete de actualización.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !modalLocked) closeHandler();
      }}
    >
      <div className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden text-left text-[var(--fg)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)]">
              <RefreshCw className={`w-4 h-4 ${queryBusy ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)]">
              {t.settings.updates.title}
            </span>
          </div>
          <button
            type="button"
            onClick={closeHandler}
            disabled={modalLocked}
            aria-label={t.common.close}
            className="p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {queryBusy ? (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--fg)]" />
              <div className="space-y-1">
                <h3 id="update-modal-title" className="text-sm font-semibold">
                  {t.settings.updates.checking}
                </h3>
                <p className="text-xs text-[var(--fg-muted)] max-w-xs mx-auto">
                  {t.settings.updates.desc}
                </p>
              </div>
            </div>
          ) : isUpToDate ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-[var(--radius-control)] border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 id="update-modal-title" className="text-base font-bold">
                    {isEn ? 'You are running the latest version' : 'Tienes la última versión disponible'}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                    {isEn
                      ? `Tornio v${updateData?.current} is up to date.`
                      : `Tornio v${updateData?.current} está actualizado.`}
                  </p>
                </div>
              </div>

              <div className="rounded-[var(--radius-control)] bg-[var(--bg)] border border-[var(--border)] p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[var(--fg-muted)]">
                  <span>{t.settings.updates.installedVersion}</span>
                  <span className="font-mono font-semibold text-[var(--fg)]">
                    v{updateData?.current}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[var(--fg-muted)]">
                  <span>GitHub Releases</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    v{updateData?.latest || updateData?.current}
                  </span>
                </div>
              </div>
            </div>
          ) : isUpdateAvailable ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className="h-10 w-10 rounded-[var(--radius-control)] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {selfUpdate.verified ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 id="update-modal-title" className="text-base font-bold">
                    {isEn
                      ? `Update available: v${selfUpdate.target_version || updateData?.latest}`
                      : `Actualización disponible: v${selfUpdate.target_version || updateData?.latest}`}
                  </h3>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                    {isEn
                      ? `Installed: v${updateData?.current || '3.0.0'}. Verified against official SHA256SUMS.`
                      : `Instalada: v${updateData?.current || '3.0.0'}. Descarga verificada contra SHA256SUMS oficial.`}
                  </p>
                </div>
              </div>

              {updateData?.notes && selfUpdate.status === 'idle' && (
                <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3 max-h-28 overflow-y-auto whitespace-pre-line font-mono text-[11px] text-[var(--fg-muted)]">
                  {updateData.notes}
                </div>
              )}

              {dlBusy && (
                <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[var(--fg-muted)]">
                    <span>
                      {selfUpdate.status === 'verifying'
                        ? isEn
                          ? 'Verifying SHA-256 checksum...'
                          : 'Verificando firma SHA-256...'
                        : isEn
                        ? 'Downloading package...'
                        : 'Descargando paquete oficial...'}
                    </span>
                    <span className="font-mono font-semibold text-[var(--fg)]">
                      {selfUpdate.total_bytes > 0
                        ? `${formatBytes(selfUpdate.downloaded_bytes)} / ${formatBytes(selfUpdate.total_bytes)} (${selfUpdate.percent}%)`
                        : formatBytes(selfUpdate.downloaded_bytes)}
                    </span>
                  </div>
                  <ProgressBar
                    value={selfUpdate.status === 'verifying' || selfUpdate.total_bytes === 0 ? undefined : selfUpdate.percent}
                    indeterminate={selfUpdate.status === 'verifying' || selfUpdate.total_bytes === 0}
                  />
                </div>
              )}

              {selfUpdate.status === 'ready_to_install' && selfUpdate.verified && (
                <div className="rounded-[var(--radius-control)] border border-emerald-500/35 bg-emerald-500/10 p-3.5 space-y-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      {isEn
                        ? 'Integrity verified (SHA-256 match)'
                        : 'Integridad verificada (SHA-256 válido)'}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] break-all opacity-80">
                    {selfUpdate.sha256_actual}
                  </p>
                </div>
              )}

              {selfUpdate.status === 'error' && selfUpdate.error && (
                <div
                  role="alert"
                  className="rounded-[var(--radius-control)] border border-red-500/35 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-300"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selfUpdate.error}</span>
                </div>
              )}
            </div>
          ) : isOffline ? (
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center text-[var(--fg-muted)] shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="update-modal-title" className="text-base font-bold">
                  {isEn ? 'GitHub unreachable (offline)' : 'Sin conexión con GitHub'}
                </h3>
                <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                  {isEn
                    ? 'Tornio continues operating 100% locally without requiring internet access.'
                    : 'Tornio continúa operando 100% en local sin requerir conexión a internet.'}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[var(--bg)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={modalLocked || dlBusy}
              onClick={retryCheckHandler}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.common.retry}</span>
            </button>
            <a
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            {dlBusy ? (
              <button
                type="button"
                onClick={() => cancelSelfUpdate()}
                className="px-4 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--fg)] hover:border-red-500/40 hover:text-red-500"
              >
                {t.common.cancel}
              </button>
            ) : selfUpdate.status === 'ready_to_install' && selfUpdate.verified ? (
              <AsyncButton
                pending={applyBusy}
                onClick={handleApplyNow}
                icon={<RotateCw className="w-3.5 h-3.5" />}
                className="px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {isEn ? 'Restart & install now' : 'Reiniciar e instalar'}
              </AsyncButton>
            ) : isUpdateAvailable ? (
              <>
                <button
                  type="button"
                  onClick={closeHandler}
                  className="px-3.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg)]"
                >
                  {t.common.cancel}
                </button>
                {canSelfDownload ? (
                  <button
                    type="button"
                    onClick={handleStartInAppDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Download & verify' : 'Descargar y verificar'}</span>
                  </button>
                ) : (
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.common.download}</span>
                  </a>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={closeHandler}
                className="px-4 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {t.common.close}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
