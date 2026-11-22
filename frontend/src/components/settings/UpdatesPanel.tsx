'use client';

import React, { useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { UpdateMode } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  selectDesktopConfig,
  selectEngineVersion,
  selectIsEngineOnline,
  useSystemStore,
} from '@/store/useSystemStore';
import { isMutationPending, isResourceBusy } from '@/lib/fsm';
import { useI18n } from '@/i18n';

interface UpdatesPanelProps {
  onCheckForUpdates: () => void;
}

export default function UpdatesPanel({ onCheckForUpdates }: UpdatesPanelProps) {
  const { t } = useI18n();
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const version = useSystemStore(selectEngineVersion);
  const online = useSystemStore(selectIsEngineOnline);
  const updateState = useSystemStore((s) => s.updateState);
  const desktopConfig = useSystemStore(selectDesktopConfig);
  const desktopMutation = useSystemStore((s) => s.desktopConfigMutation);
  const loadDesktopConfig = useSystemStore((s) => s.loadDesktopConfig);
  const saveDesktopConfig = useSystemStore((s) => s.saveDesktopConfig);
  const selfUpdateStatus = useSystemStore((s) => s.selfUpdateStatus);

  useEffect(() => {
    loadDesktopConfig().catch(() => {});
  }, [loadDesktopConfig]);

  const checkBusy = isResourceBusy(updateState);
  const mutating = isMutationPending(desktopMutation);
  const activeMode: UpdateMode = desktopConfig?.update_mode ?? 'notify';

  const handleModeChange = async (mode: UpdateMode) => {
    updateSetting('autoCheckUpdatesOnStart', mode !== 'manual');
    try {
      await saveDesktopConfig({ update_mode: mode });
      toast.success(t.settings.desktop.savedNotice, { duration: 2000 });
    } catch {
      toast.error(t.settings.desktop.offlineWarning);
    }
  };

  const modes: { id: UpdateMode; title: string; desc: string }[] = [
    {
      id: 'notify',
      title: t.settings.updates.modes.notify.title,
      desc: t.settings.updates.modes.notify.desc,
    },
    {
      id: 'auto',
      title: t.settings.updates.modes.auto.title,
      desc: t.settings.updates.modes.auto.desc,
    },
    {
      id: 'manual',
      title: t.settings.updates.modes.manual.title,
      desc: t.settings.updates.modes.manual.desc,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[var(--fg)]" />
              <h2 className="text-sm font-semibold text-[var(--fg)]">
                {t.settings.updates.title}
              </h2>
            </div>
            <p className="text-xs text-[var(--fg-muted)] max-w-xl">
              {t.settings.updates.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={onCheckForUpdates}
            disabled={checkBusy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkBusy ? 'animate-spin' : ''}`} />
            <span>
              {checkBusy ? t.settings.updates.checking : t.settings.updates.checkNow}
            </span>
          </button>
        </div>

        <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[var(--fg-muted)] block">
              {t.settings.updates.installedVersion}
            </span>
            <span className="font-mono font-semibold text-[var(--fg)] text-sm">
              v{version}
            </span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">
              {t.settings.updates.officialChannel}
            </span>
            <span className="font-semibold text-[var(--fg)]">GitHub Releases</span>
          </div>
          <div>
            <span className="text-[var(--fg-muted)] block">
              {t.settings.updates.connectionStatus}
            </span>
            <span
              className={`font-semibold ${
                online
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {online ? t.settings.updates.serverActive : t.settings.updates.offlineMode}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <span className="text-xs font-semibold text-[var(--fg)] block">
              {t.settings.updates.modeLabel}
            </span>
            <span className="text-[11px] text-[var(--fg-muted)]">
              {t.settings.updates.modeDesc}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {modes.map((m) => {
              const selected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={mutating}
                  onClick={() => handleModeChange(m.id)}
                  className={`p-3.5 rounded-[var(--radius-control)] border text-left transition-colors disabled:opacity-60 ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--fg)]">{m.title}</span>
                    <span
                      className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-strong)]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1 leading-relaxed">
                    {m.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-control)] border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t.settings.updates.shaBadge}</span>
          </span>
          {selfUpdateStatus.status === 'ready_to_install' && selfUpdateStatus.verified && (
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              v{selfUpdateStatus.target_version} OK
            </span>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[var(--fg-muted)]">
            {t.settings.updates.manualDownloadsHint}
          </span>
          <a
            href="https://github.com/albert-dilas/OpenPDF/releases"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-[var(--fg)] hover:underline"
          >
            <span>{t.settings.updates.viewAllReleases}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
