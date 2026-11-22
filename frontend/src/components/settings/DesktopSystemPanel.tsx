'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Monitor,
  FolderOpen,
  HardDrive,
  Trash2,
  Shield,
  AlertTriangle,
  Archive,
  Save,
  MousePointerClick,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DesktopConfig,
  fetchStorageSummary,
  formatBytes,
  openLocalFolder,
  purgeTempStorage,
  SaveMode,
  StorageSummary,
} from '@/lib/api';
import {
  AsyncResourceState,
  isMutationPending,
  isResourceBusy,
  MutationState,
} from '@/lib/fsm';
import { selectDesktopConfig, useSystemStore } from '@/store/useSystemStore';
import { AsyncButton, SkeletonCard } from '@/components/ui/Loaders';
import { useI18n } from '@/i18n';

export default function DesktopSystemPanel() {
  const { t } = useI18n();
  const desktopCopy = t.settings.desktop;

  const desktopConfig = useSystemStore(selectDesktopConfig);
  const desktopConfigState = useSystemStore((s) => s.desktopConfigState);
  const desktopConfigMutation = useSystemStore((s) => s.desktopConfigMutation);
  const loadDesktopConfig = useSystemStore((s) => s.loadDesktopConfig);
  const saveDesktopConfig = useSystemStore((s) => s.saveDesktopConfig);

  const [storageState, setStorageState] = useState<AsyncResourceState<StorageSummary>>({
    status: 'idle',
  });
  const [purgeMutation, setPurgeMutation] = useState<MutationState>({ status: 'idle' });
  const [folderDraft, setFolderDraft] = useState<string>('');

  const refreshStorage = useCallback(async () => {
    setStorageState((prev) =>
      prev.status === 'ready' ? { status: 'revalidating', data: prev.data } : { status: 'loading' }
    );
    try {
      const data = await fetchStorageSummary();
      setStorageState({ status: 'ready', data });
    } catch {
      setStorageState((prev) => ({
        status: 'offline',
        data: 'data' in prev ? prev.data : undefined,
        error: desktopCopy.offlineWarning,
      }));
    }
  }, [desktopCopy.offlineWarning]);

  useEffect(() => {
    loadDesktopConfig().catch(() => {});
    refreshStorage();
  }, [loadDesktopConfig, refreshStorage]);

  useEffect(() => {
    if (desktopConfig?.default_output_dir) {
      setFolderDraft(desktopConfig.default_output_dir);
    }
  }, [desktopConfig?.default_output_dir]);

  const applyPatch = async (patch: Partial<DesktopConfig>) => {
    try {
      await saveDesktopConfig(patch);
      toast.success(desktopCopy.savedNotice, { duration: 2200 });
      refreshStorage();
    } catch {
      toast.error(desktopCopy.offlineWarning);
    }
  };

  const handleSaveFolderPath = async () => {
    const trimmed = folderDraft.trim();
    if (!trimmed) {
      toast.error(desktopCopy.defaultOutputDirLabel);
      return;
    }
    await applyPatch({ default_output_dir: trimmed });
  };

  const handlePurgeTemp = async () => {
    setPurgeMutation({ status: 'pending' });
    try {
      const res = await purgeTempStorage(false);
      setStorageState({ status: 'ready', data: res.storage });
      setPurgeMutation({ status: 'success', data: undefined });
      toast.success(`${desktopCopy.purgedSuccess} (${formatBytes(res.freed_bytes)})`);
    } catch {
      setPurgeMutation({ status: 'error', error: desktopCopy.offlineWarning });
      toast.error(desktopCopy.offlineWarning);
    }
  };

  const handleOpenFolder = async (target: 'data' | 'output') => {
    try {
      await openLocalFolder(target);
    } catch {
      toast.error(desktopCopy.offlineWarning);
    }
  };

  const cfg: DesktopConfig = desktopConfig ?? {
    keep_in_background: false,
    start_with_windows: false,
    start_minimized: true,
    context_menu_enabled: false,
    update_mode: 'notify',
    save_mode: 'ask',
    default_output_dir: '',
    clean_temp_on_exit: true,
    smart_zip_downloads: true,
  };

  const configBusy =
    isResourceBusy(desktopConfigState) && !desktopConfig;
  const mutating = isMutationPending(desktopConfigMutation);
  const purging = isMutationPending(purgeMutation);
  const storageBusy = isResourceBusy(storageState);
  const storageData = 'data' in storageState ? storageState.data : undefined;

  if (configBusy) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Lifecycle & Windows Integration */}
      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {desktopCopy.lifecycleTitle}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {desktopCopy.lifecycleDesc}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            {desktopCopy.closeModeLabel}
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                value: false,
                title: desktopCopy.closeCompleteTitle,
                desc: desktopCopy.closeCompleteDesc,
              },
              {
                value: true,
                title: desktopCopy.keepBgTitle,
                desc: desktopCopy.keepBgDesc,
              },
            ].map((opt) => {
              const selected = cfg.keep_in_background === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={mutating}
                  onClick={() => applyPatch({ keep_in_background: opt.value })}
                  className={`p-4 rounded-[var(--radius-control)] border text-left transition-colors disabled:opacity-60 ${
                    selected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--fg)]">{opt.title}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-strong)]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border)] space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <span className="text-xs font-semibold text-[var(--fg)] block">
                {desktopCopy.autostartLabel}
              </span>
              <span className="text-[11px] text-[var(--fg-muted)]">
                {desktopCopy.autostartDesc}
              </span>
            </div>
            <input
              type="checkbox"
              disabled={mutating}
              checked={cfg.start_with_windows}
              onChange={(e) => applyPatch({ start_with_windows: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)]"
            />
          </label>

          {cfg.start_with_windows && (
            <label className="ml-4 pl-4 border-l border-[var(--border)] flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <span className="text-xs font-medium text-[var(--fg)] block">
                  {desktopCopy.startMinimizedLabel}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {desktopCopy.startMinimizedDesc}
                </span>
              </div>
              <input
                type="checkbox"
                disabled={mutating}
                checked={cfg.start_minimized}
                onChange={(e) => applyPatch({ start_minimized: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border-strong)]"
              />
            </label>
          )}

          <label className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <MousePointerClick className="w-4 h-4 text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--fg)] block">
                  {desktopCopy.contextMenuLabel}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {desktopCopy.contextMenuDesc}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={mutating}
              checked={cfg.context_menu_enabled}
              onChange={(e) => applyPatch({ context_menu_enabled: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] shrink-0"
            />
          </label>
        </div>
      </section>

      {/* 2. Quick Save, Smart ZIP & Exit Privacy */}
      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]">
            <Save className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">
              {desktopCopy.storageSaveTitle}
            </h2>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {desktopCopy.storageSaveDesc}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(
            [
              {
                mode: 'ask' as SaveMode,
                title: desktopCopy.saveModeAskTitle,
                desc: desktopCopy.saveModeAskDesc,
              },
              {
                mode: 'fixed_folder' as SaveMode,
                title: desktopCopy.saveModeFixedTitle,
                desc: desktopCopy.saveModeFixedDesc,
              },
            ]
          ).map((opt) => {
            const selected = cfg.save_mode === opt.mode;
            return (
              <button
                key={opt.mode}
                type="button"
                disabled={mutating}
                onClick={() => applyPatch({ save_mode: opt.mode })}
                className={`p-4 rounded-[var(--radius-control)] border text-left transition-colors disabled:opacity-60 ${
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)]'
                }`}
              >
                <span className="text-xs font-semibold text-[var(--fg)] block">{opt.title}</span>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="desktop-default-output-dir"
            className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]"
          >
            {desktopCopy.defaultOutputDirLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="desktop-default-output-dir"
              type="text"
              value={folderDraft}
              onChange={(e) => setFolderDraft(e.target.value)}
              className="flex-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-mono text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <AsyncButton
                pending={mutating}
                onClick={handleSaveFolderPath}
                className="px-3.5 py-2 rounded-[var(--radius-control)] text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {t.common.save}
              </AsyncButton>
              <button
                type="button"
                onClick={() => handleOpenFolder('output')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{desktopCopy.openOutputFolderBtn}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border)] space-y-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <Archive className="w-4 h-4 text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--fg)] block">
                  {desktopCopy.smartZipLabel}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {desktopCopy.smartZipDesc}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={mutating}
              checked={cfg.smart_zip_downloads}
              onChange={(e) => applyPatch({ smart_zip_downloads: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] shrink-0"
            />
          </label>

          <label className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-[var(--fg-muted)] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-[var(--fg)] block">
                  {desktopCopy.cleanOnExitLabel}
                </span>
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {desktopCopy.cleanOnExitDesc}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={mutating}
              checked={cfg.clean_temp_on_exit}
              onChange={(e) => applyPatch({ clean_temp_on_exit: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-strong)] shrink-0"
            />
          </label>
        </div>
      </section>

      {/* 3. Local Storage Panel */}
      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--fg)]">
                {desktopCopy.localStorageTitle}
              </h2>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                {desktopCopy.localStorageDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={storageBusy}
            onClick={refreshStorage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${storageBusy ? 'animate-spin' : ''}`} />
            <span>{t.common.retry}</span>
          </button>
        </div>

        {storageData?.low_space_warning && (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{desktopCopy.lowSpaceAlert}</span>
          </div>
        )}

        {storageData ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                {
                  label: desktopCopy.diskFreeLabel,
                  value: formatBytes(storageData.free_bytes),
                  highlight: storageData.low_space_warning,
                },
                { label: desktopCopy.tempSizeLabel, value: formatBytes(storageData.temp_bytes) },
                { label: desktopCopy.sessionSizeLabel, value: formatBytes(storageData.session_bytes) },
                { label: desktopCopy.modelsSizeLabel, value: formatBytes(storageData.models_bytes) },
                { label: desktopCopy.recipesSizeLabel, value: formatBytes(storageData.recipes_bytes) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] p-3"
                >
                  <span className="text-[11px] text-[var(--fg-muted)] block">{stat.label}</span>
                  <span
                    className={`font-mono font-semibold text-sm mt-0.5 block ${
                      stat.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--fg)]'
                    }`}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)] text-xs">
              <span className="font-mono text-[11px] text-[var(--fg-muted)] truncate max-w-full">
                {storageData.data_dir}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenFolder('data')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>{desktopCopy.openDataFolderBtn}</span>
                </button>
                <AsyncButton
                  pending={purging}
                  onClick={handlePurgeTemp}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-red-500/40 hover:text-red-500 text-xs font-medium text-[var(--fg)]"
                >
                  {desktopCopy.purgeTempBtn}
                </AsyncButton>
              </div>
            </div>
          </>
        ) : (
          <div className="text-xs text-[var(--fg-muted)]">{desktopCopy.offlineWarning}</div>
        )}
      </section>
    </div>
  );
}
