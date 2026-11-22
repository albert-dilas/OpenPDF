'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pin, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import HomeActionHeader from '@/components/home/HomeActionHeader';
import StudioLauncherGrid from '@/components/home/StudioLauncherGrid';
import HomeQuickDropStrip from '@/components/home/HomeQuickDropStrip';
import PinnedToolsStrip from '@/components/home/PinnedToolsStrip';
import ToolIcon from '@/components/ui/ToolIcon';
import SectionHeader from '@/components/ui/SectionHeader';
import { EngineOrbState } from '@/components/shell/EngineOrb3D';
import { ALL_STUDIO_TOOLS, StudioId } from '@/config/studios';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  selectEngineCapabilities,
  selectIsEngineOffline,
  selectSystemMetrics,
  useSystemStore,
} from '@/store/useSystemStore';
import { selectJobs, useJobsStore } from '@/store/useJobsStore';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import { extractErrorMessage } from '@/lib/api';
import { useI18n } from '@/i18n';

type GreetingPhase = 'fallback' | 'morning' | 'afternoon' | 'evening';

export default function HomePage() {
  const router = useRouter();
  const { t, locale } = useI18n();

  const hydrationState = useSettingsStore((s) => s.hydrationState);
  const threeDLevel = useSettingsStore((s) => s.threeDLevel);
  const reduceAnimations = useSettingsStore((s) => s.reduceAnimations);
  const workspaceProfile = useSettingsStore((s) => s.workspaceProfile);
  const enabledStudios = useSettingsStore((s) => s.enabledStudios);
  const studioOrder = useSettingsStore((s) => s.studioOrder);
  const pinnedToolIds = useSettingsStore((s) => s.pinnedToolIds);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const applyWorkspaceProfile = useSettingsStore((s) => s.applyWorkspaceProfile);
  const togglePinTool = useSettingsStore((s) => s.togglePinTool);

  const engineOffline = useSystemStore(selectIsEngineOffline);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const systemMetrics = useSystemStore(selectSystemMetrics);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);

  const jobs = useJobsStore(selectJobs);
  const assets = useWorkspaceStore(selectAssets);
  const activeAssetId = useWorkspaceStore((s) => s.activeAssetId);
  const inspectState = useWorkspaceStore((s) => s.inspectState);
  const inspectAndAddFiles = useWorkspaceStore((s) => s.inspectAndAddFiles);
  const abortInspect = useWorkspaceStore((s) => s.abortInspect);
  const chainAssetToTool = useWorkspaceStore((s) => s.chainAssetToTool);

  const [greetingPhase, setGreetingPhase] = useState<GreetingPhase>('fallback');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (hydrationState !== 'hydrated') return;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreetingPhase('morning');
    else if (hour >= 12 && hour < 20) setGreetingPhase('afternoon');
    else setGreetingPhase('evening');
  }, [hydrationState]);

  const greetingText =
    greetingPhase === 'morning'
      ? t.home.greetingMorning
      : greetingPhase === 'afternoon'
      ? t.home.greetingAfternoon
      : greetingPhase === 'evening'
      ? t.home.greetingEvening
      : t.home.greetingFallback;

  const activeJobsMeta = useMemo(() => {
    const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running');
    if (active.length === 0) return { count: 0, avgProgress: undefined as number | undefined };
    const vals = active.map((j) => j.progress || 0);
    const hasProgress = vals.some((v) => v > 0);
    const avg = hasProgress ? Math.round(vals.reduce((a, b) => a + b, 0) / active.length) : undefined;
    return { count: active.length, avgProgress: avg };
  }, [jobs]);
  const activeJobsCount = activeJobsMeta.count;

  const orbState: EngineOrbState = engineOffline
    ? 'offline'
    : activeJobsCount > 0
    ? 'running'
    : 'idle';

  const orbAriaLabel =
    orbState === 'offline'
      ? t.home.orbStatusOffline
      : orbState === 'running'
      ? t.home.orbStatusRunning
      : t.home.orbStatusIdle;

  const orderedEnabledStudios = useMemo(() => {
    const enabledSet = new Set(enabledStudios);
    return studioOrder.filter((id) => enabledSet.has(id));
  }, [enabledStudios, studioOrder]);

  const latestAsset = useMemo(() => {
    if (!assets.length) return null;
    return (activeAssetId && assets.find((a) => a.id === activeAssetId)) || assets[0];
  }, [activeAssetId, assets]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_STUDIO_TOOLS.filter((tool) => {
      const copy = t.tools[tool.id];
      const studioCopy = t.studios[tool.studio];
      const haystack = [
        tool.id,
        copy?.name ?? '',
        copy?.description ?? '',
        studioCopy?.name ?? '',
        ...(tool.accepts ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [searchQuery, t.studios, t.tools]);

  const handleInspectFiles = async (fileList: File[]) => {
    if (!fileList.length) return;
    try {
      const created = await inspectAndAddFiles(fileList);
      if (created.length > 0) {
        toast.success(
          locale === 'en'
            ? `Ready: ${created[0].filename}`
            : `Archivo listo: ${created[0].filename}`
        );
      }
    } catch (err) {
      const msg = await extractErrorMessage(err, t.home.dropzoneInspecting);
      toast.error(msg);
    }
  };

  const handleSelectStudio = (studioId: StudioId) => {
    router.push(`/studios/${studioId}`);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      <HomeActionHeader
        greeting={greetingText}
        subtitle={t.home.heroSubtitle}
        orbState={orbState}
        orbAriaLabel={orbAriaLabel}
        threeDLevel={threeDLevel}
        reduceAnimations={reduceAnimations}
        capabilities={capabilities}
        systemMetrics={systemMetrics}
        activeJobsCount={activeJobsCount}
        activeProgress={activeJobsMeta.avgProgress}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDropFiles={handleInspectFiles}
        onOpenJobs={() => updateSetting('jobDrawerOpen', true)}
        onOpenModules={() => setModulesModalOpen(true)}
      />

      {searchQuery.trim() ? (
        <section className="space-y-4 animate-fade-in">
          <SectionHeader
            title={`${t.home.catalogTitle} (${filteredTools.length})`}
            subtitle={t.home.catalogSubtitle}
          />
          {filteredTools.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-[var(--fg)]">
                {t.common.noResults}: &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] underline"
              >
                {t.home.clearFilters}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTools.map((tool) => {
                const copy = t.tools[tool.id];
                const studioCopy = t.studios[tool.studio];
                const isPinned = pinnedToolIds.includes(tool.id);
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group relative rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] p-4 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <ToolIcon
                        tool={{
                          iconName: tool.iconName,
                          studioId: tool.studio,
                          name: copy?.name,
                        }}
                        size="md"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]">
                          {studioCopy?.name}
                        </span>
                        {tool.requiresInternet && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300">
                            <Globe className="w-2.5 h-2.5" />
                            {t.common.online}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePinTool(tool.id);
                          }}
                          title={isPinned ? t.common.unpinShortcut : t.common.pinShortcut}
                          className={`p-1 rounded-[var(--radius-control)] border transition-colors ${
                            isPinned
                              ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--fg)]'
                              : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[var(--fg)] tracking-tight">
                        {copy?.name ?? tool.id}
                      </h3>
                      <p className="text-xs text-[var(--fg-muted)] leading-relaxed line-clamp-2">
                        {copy?.description ?? ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          <StudioLauncherGrid
            studioIds={orderedEnabledStudios}
            threeDLevel={threeDLevel}
            reduceAnimations={reduceAnimations}
            workspaceProfile={workspaceProfile}
            onSelectProfile={(profId) => {
              applyWorkspaceProfile(profId);
              toast.success(
                locale === 'en'
                  ? `Workspace adapted: ${t.home.profiles[profId]}`
                  : `Espacio adaptado: ${t.home.profiles[profId]}`
              );
            }}
            onSelectStudio={handleSelectStudio}
          />

          <HomeQuickDropStrip
            inspectState={inspectState}
            latestAsset={latestAsset}
            totalAssetsCount={assets.length}
            onFilesSelected={handleInspectFiles}
            onAbort={abortInspect}
            onChainToTool={(asset, href) =>
              chainAssetToTool(asset, href, (path) => router.push(path))
            }
          />

          <PinnedToolsStrip pinnedToolIds={pinnedToolIds} />
        </>
      )}
    </div>
  );
}
