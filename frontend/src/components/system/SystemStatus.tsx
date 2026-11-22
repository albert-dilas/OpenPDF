'use client';

import { useEffect, useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  X,
  ExternalLink,
  Cpu,
  Blocks,
  Search,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  selectDesktopConfig,
  selectEngineCapabilities,
  selectEngineVersion,
  selectHasCheckedEngine,
  selectIsEngineChecking,
  selectIsEngineOffline,
  selectIsEngineOnline,
  selectMaxFileSizeMb,
  selectUpdateInfo,
  useSystemStore,
} from '@/store/useSystemStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ModuleRequirement } from '@/config/studios';
import { useI18n } from '@/i18n';

let pollerInitialized = false;

export function SystemStatusPoller() {
  const checkStatus = useSystemStore((s) => s.checkStatus);
  const checkUpdatesOnce = useSystemStore((s) => s.checkUpdatesOnce);
  const refreshSelfUpdateStatus = useSystemStore((s) => s.refreshSelfUpdateStatus);
  const beginSelfUpdateDownload = useSystemStore((s) => s.beginSelfUpdateDownload);
  const setImmersiveMode = useSystemStore((s) => s.setImmersiveMode);

  useEffect(() => {
    useSettingsStore.getState().hydrateFromStorage();
    const settings = useSettingsStore.getState();
    if (settings.immersiveByDefault) {
      setImmersiveMode(true);
    }

    if (!pollerInitialized) {
      pollerInitialized = true;
      (async () => {
        const snapshot = await checkStatus();
        await refreshSelfUpdateStatus().catch(() => null);
        const mode = snapshot?.desktop?.update_mode ?? 'notify';
        if (mode === 'manual') return;
        const info = await checkUpdatesOnce();
        if (
          mode === 'auto' &&
          info?.online &&
          info.update_available &&
          (info.installer_url || info.portable_url || info.download_url) &&
          info.checksums_url
        ) {
          const st = useSystemStore.getState().selfUpdateStatus;
          if (st.status === 'idle' || st.status === 'cancelled') {
            beginSelfUpdateDownload(info).catch(() => {});
          }
        }
      })();
    }

    const interval = setInterval(() => {
      checkStatus();
    }, 30000);
    return () => {
      clearInterval(interval);
      pollerInitialized = false;
    };
  }, [
    beginSelfUpdateDownload,
    checkStatus,
    checkUpdatesOnce,
    refreshSelfUpdateStatus,
    setImmersiveMode,
  ]);

  return null;
}

export function SystemStatusBadge() {
  const { t } = useI18n();
  const isOffline = useSystemStore(selectIsEngineOffline);
  const checking = useSystemStore(selectIsEngineChecking);
  const hasCheckedOnce = useSystemStore(selectHasCheckedEngine);
  const version = useSystemStore(selectEngineVersion);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const maxFileSizeMb = useSystemStore(selectMaxFileSizeMb);
  const checkStatus = useSystemStore((s) => s.checkStatus);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);

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

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
          isOffline
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--border-strong)]'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOffline ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
        <span>
          {checking && !hasCheckedOnce
            ? t.brand.engineChipChecking
            : isOffline
            ? t.brand.engineChipOffline
            : t.brand.engineChipOnline}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 mt-2 w-72 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-xl p-4 z-50 text-left animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[var(--fg)]" />
              <span className="text-xs font-semibold text-[var(--fg)]">
                {t.brand.name} v{version}
              </span>
            </div>
            <button
              type="button"
              onClick={() => checkStatus()}
              aria-label={t.common.retry}
              className="p-1 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isOffline ? (
            <div className="text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 p-3 rounded-[var(--radius-control)] border border-amber-500/20">
              {t.brand.engineChipOffline}
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[var(--fg-muted)]">
                <span>127.0.0.1</span>
                <span className="font-mono font-semibold text-[var(--fg)]">
                  {maxFileSizeMb} MB max
                </span>
              </div>
              <div className="pt-2 border-t border-[var(--border)] space-y-1">
                {(['ocr', 'word_to_pdf', 'ffmpeg', 'yt_dlp', 'rembg_onnx', 'whisper_cpu'] as const).map(
                  (key) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[var(--fg-muted)]">
                        {t.modulesModal.items[key].shortTitle}
                      </span>
                      {capabilities[key] ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> {t.common.ready}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertTriangle className="w-3 h-3" /> {t.common.pending}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setModulesModalOpen(true);
                }}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-fg)',
                }}
              >
                <Blocks className="w-3.5 h-3.5" />
                <span>{t.settings.modules.openCenterBtn}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UpdateBanner() {
  const updateInfo = useSystemStore(selectUpdateInfo);
  const desktopConfig = useSystemStore(selectDesktopConfig);
  const selfUpdateStatus = useSystemStore((s) => s.selfUpdateStatus);
  const updateDismissed = useSystemStore((s) => s.updateDismissed);
  const dismissUpdate = useSystemStore((s) => s.dismissUpdate);
  const setUpdateModalOpen = useSystemStore((s) => s.setUpdateModalOpen);
  const { locale } = useI18n();

  if (desktopConfig?.update_mode === 'manual') {
    return null;
  }

  const readyToInstall =
    selfUpdateStatus.status === 'ready_to_install' && selfUpdateStatus.verified;

  if (
    !readyToInstall &&
    (!updateInfo || !updateInfo.update_available || !updateInfo.online || updateDismissed)
  ) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg)] px-4 py-1.5 text-xs"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {readyToInstall ? (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          ) : (
            <Download className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
          )}
          <span>
            {readyToInstall
              ? locale === 'en'
                ? `Tornio v${selfUpdateStatus.target_version} verified (SHA-256) and ready to install.`
                : `Tornio v${selfUpdateStatus.target_version} verificado (SHA-256) y listo para instalar.`
              : locale === 'en'
              ? `New Tornio release v${updateInfo?.latest} available (v${updateInfo?.current}).`
              : `Nueva versión de Tornio v${updateInfo?.latest} disponible (v${updateInfo?.current}).`}
          </span>

          <button
            type="button"
            onClick={() => setUpdateModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-control)] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <span>
              {readyToInstall
                ? locale === 'en'
                  ? 'Restart & install'
                  : 'Reiniciar e instalar'
                : locale === 'en'
                ? '1-Click Update'
                : 'Actualizar en 1 clic'}
            </span>
          </button>

          {updateInfo?.url && (
            <a
              href={updateInfo.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 underline text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={dismissUpdate}
          aria-label="Dismiss update banner"
          className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--surface)] transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CapabilityWarningBanner({
  capability,
}: {
  capability?: ModuleRequirement;
}) {
  const { t, locale } = useI18n();
  const hasCheckedOnce = useSystemStore(selectHasCheckedEngine);
  const online = useSystemStore(selectIsEngineOnline);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const checking = useSystemStore(selectIsEngineChecking);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);
  const detectModules = useSystemStore((s) => s.detectModules);

  if (!capability || !hasCheckedOnce || !online) return null;
  if (capabilities[capability]) return null;

  const modCopy = t.modulesModal.items[capability];

  const handleQuickDetect = async () => {
    const res = await detectModules();
    if (res?.capabilities?.[capability]) {
      toast.success(t.modulesModal.binaryLinkedToast);
    } else {
      toast(t.modulesModal.rescanDone, { duration: 3000 });
    }
  };

  return (
    <div
      role="alert"
      className="max-w-4xl mx-auto mb-5 rounded-[var(--radius-card)] border border-amber-500/35 bg-amber-500/10 px-4 py-3.5 text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--fg)] space-y-0.5">
            <p className="font-semibold">
              {modCopy.title} — {t.modulesModal.statusPending}
            </p>
            <p className="text-[var(--fg-muted)] leading-relaxed">{modCopy.installDesc}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-fg)',
            }}
          >
            <Blocks className="w-3.5 h-3.5" />
            <span>
              {locale === 'en' ? '1-Click Setup' : 'Instalar / Conectar'}
            </span>
          </button>
          <button
            type="button"
            disabled={checking}
            onClick={handleQuickDetect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.modulesModal.optionBButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
