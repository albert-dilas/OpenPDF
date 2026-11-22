'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Blocks,
  Cpu,
  HardDrive,
  Monitor,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import EngineOrb3D, { EngineOrbState } from '@/components/shell/EngineOrb3D';
import {
  fetchStorageSummary,
  formatBytes,
  purgeTempStorage,
  StorageSummary,
  SystemCapabilities,
  SystemMetricsInfo,
} from '@/lib/api';
import {
  AsyncResourceState,
  isMutationPending,
  isResourceBusy,
  MutationState,
} from '@/lib/fsm';
import { ThreeDLevel } from '@/lib/appearance';
import { AsyncButton } from '@/components/ui/Loaders';
import { useI18n } from '@/i18n';

interface HomeActionHeaderProps {
  greeting: string;
  subtitle: string;
  orbState: EngineOrbState;
  orbAriaLabel: string;
  threeDLevel: ThreeDLevel;
  reduceAnimations: boolean;
  capabilities?: SystemCapabilities;
  systemMetrics?: SystemMetricsInfo | null;
  activeJobsCount?: number;
  activeProgress?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onDropFiles?: (files: File[]) => void;
  onOpenJobs?: () => void;
  onOpenModules?: () => void;
}

export default function HomeActionHeader({
  greeting,
  subtitle,
  orbState,
  orbAriaLabel,
  threeDLevel,
  reduceAnimations,
  capabilities,
  systemMetrics,
  activeJobsCount = 0,
  activeProgress,
  searchQuery,
  onSearchChange,
  onDropFiles,
  onOpenJobs,
  onOpenModules,
}: HomeActionHeaderProps) {
  const { t, locale } = useI18n();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [storageState, setStorageState] = useState<AsyncResourceState<StorageSummary>>({
    status: 'idle',
  });
  const [purgeState, setPurgeState] = useState<MutationState>({ status: 'idle' });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const readyEnginesCount = capabilities
    ? [
        capabilities.ocr,
        capabilities.word_to_pdf,
        capabilities.ffmpeg,
        capabilities.yt_dlp,
        capabilities.rembg_onnx,
        capabilities.whisper_cpu,
      ].filter(Boolean).length
    : 0;

  useEffect(() => {
    if (!popoverOpen) return;

    let cancelled = false;
    setStorageState((prev) =>
      prev.status === 'ready'
        ? { status: 'revalidating', data: prev.data }
        : { status: 'loading' }
    );
    fetchStorageSummary()
      .then((data) => {
        if (!cancelled) setStorageState({ status: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setStorageState({ status: 'offline' });
      });

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopoverOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      cancelled = true;
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [popoverOpen]);

  const handleQuickPurge = async () => {
    setPurgeState({ status: 'pending' });
    try {
      const res = await purgeTempStorage(false);
      setStorageState({ status: 'ready', data: res.storage });
      setPurgeState({ status: 'success', data: undefined });
      toast.success(
        `${t.settings.desktop.purgedSuccess} (${formatBytes(res.freed_bytes)})`
      );
    } catch {
      setPurgeState({ status: 'error', error: 'purge_failed' });
      toast.error(t.settings.desktop.offlineWarning);
    }
  };

  const orbCaption =
    orbState === 'offline'
      ? locale === 'en'
        ? 'Offline'
        : 'Sin conexión'
      : orbState === 'running'
      ? locale === 'en'
        ? `Processing (${Math.max(1, activeJobsCount)})`
        : `Procesando (${Math.max(1, activeJobsCount)})`
      : locale === 'en'
      ? `Core · ${readyEnginesCount}/6`
      : `Núcleo · ${readyEnginesCount}/6`;

  const storageData = 'data' in storageState ? storageState.data : undefined;
  const storageLoading = isResourceBusy(storageState) && !storageData;

  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
      <div className="flex-1 space-y-3.5 max-w-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--fg)] text-balance">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--fg-muted)] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Single canonical instant search bar on Home */}
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-[var(--fg-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.home.searchPlaceholder}
            aria-label={t.home.searchPlaceholder}
            className="w-full pl-10 pr-20 py-2.5 rounded-[var(--radius-control)] border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)] text-xs sm:text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.commandPalette.clearInput}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[var(--surface-muted)] text-[var(--fg)] hover:opacity-80"
            >
              <X className="w-3 h-3" />
              <span>{t.common.clear}</span>
            </button>
          )}
        </div>
      </div>

      {/* Calibrated Precision Core + Telemetry Quick-Actions Popover */}
      <div
        ref={containerRef}
        className="relative shrink-0 self-start sm:self-center flex flex-col items-center gap-1"
      >
        <EngineOrb3D
          state={orbState}
          threeDLevel={threeDLevel}
          reduceAnimations={reduceAnimations}
          size={88}
          capabilities={capabilities}
          activeJobsCount={activeJobsCount}
          activeProgress={activeProgress}
          onDropFiles={onDropFiles}
          ariaLabel={orbAriaLabel}
          onClick={() => setPopoverOpen((v) => !v)}
        />
        <span className="text-[11px] font-mono font-medium text-[var(--fg-muted)] select-none">
          {orbCaption}
        </span>

        {popoverOpen && (
          <div
            role="dialog"
            aria-label={t.home.orbPopover.title}
            className="absolute right-0 top-full mt-2 w-72 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-4 z-50 text-left space-y-3.5 animate-fade-in"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    orbState === 'offline'
                      ? 'bg-amber-500'
                      : orbState === 'running'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-semibold text-[var(--fg)] truncate">
                  {orbState === 'offline'
                    ? t.home.orbPopover.statusOffline
                    : orbState === 'running'
                    ? t.home.orbPopover.statusRunning
                    : t.home.orbPopover.statusOnline}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                aria-label={t.common.close}
                className="p-1 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Hardware & Disk Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2">
                <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> {t.home.orbPopover.cpuLabel} / {t.home.orbPopover.ramLabel}
                </span>
                <span className="font-mono font-semibold text-[var(--fg)] mt-0.5 block">
                  {systemMetrics
                    ? `${Math.round(systemMetrics.cpu_percent)}% · ${Math.round(systemMetrics.memory_used_percent)}%`
                    : '--'}
                </span>
              </div>
              <div className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2">
                <span className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> {t.home.orbPopover.diskFreeLabel}
                </span>
                <span className="font-mono font-semibold text-[var(--fg)] mt-0.5 block">
                  {storageLoading
                    ? '...'
                    : storageData
                    ? formatBytes(storageData.free_bytes)
                    : '--'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--fg-muted)] leading-snug">
              {t.home.orbPopover.dropHint}
            </p>

            {/* Quick Actions */}
            <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  onOpenJobs?.();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{t.home.orbPopover.viewJobs}</span>
                </span>
                {activeJobsCount > 0 && (
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
                  >
                    {activeJobsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false);
                  onOpenModules?.();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <Blocks className="w-3.5 h-3.5" />
                  <span>{t.home.orbPopover.configureEngines}</span>
                </span>
                <span className="font-mono text-[10px] text-[var(--fg-muted)]">
                  {readyEnginesCount}/6
                </span>
              </button>

              <AsyncButton
                pending={isMutationPending(purgeState)}
                onClick={handleQuickPurge}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="w-full justify-between px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
              >
                <span className="flex-1 text-left">{t.home.orbPopover.purgeTemp}</span>
              </AsyncButton>

              <Link
                href="/settings?tab=system"
                onClick={() => setPopoverOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-control)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{t.home.orbPopover.desktopSettings}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
