'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Inbox,
  Workflow,
  Settings,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Blocks,
  Palette,
  Menu,
  X,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  FolderArchive,
  Cpu,
  Globe,
  Pin,
  Minimize2,
  MessageSquarePlus,
} from 'lucide-react';
import { TornioEmblem } from '@/components/shell/TornioEmblem';
import JobQueueDrawer from '@/components/shell/JobQueueDrawer';
import ModulesModal from '@/components/system/ModulesModal';
import UpdateModal from '@/components/system/UpdateModal';
import QuickFeedbackModal from '@/components/system/QuickFeedbackModal';
import CommandPalette from '@/components/layout/CommandPalette';
import TopProgressBar from '@/components/ui/TopProgressBar';
import { ProgressRing, PulseDots } from '@/components/ui/Loaders';
import { SystemStatusPoller, UpdateBanner } from '@/components/system/SystemStatus';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  selectEngineCapabilities,
  selectHasCheckedEngine,
  selectIsEngineChecking,
  selectIsEngineOffline,
  useSystemStore,
} from '@/store/useSystemStore';
import {
  registerJobAssetListener,
  selectJobs,
  useJobsStore,
} from '@/store/useJobsStore';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import { getToolByHref, getToolById, StudioId } from '@/config/studios';
import { STUDIO_PALETTES } from '@/lib/studio-palettes';
import { AppSkin } from '@/lib/appearance';
import { useI18n } from '@/i18n';

const STUDIO_ICONS: Record<StudioId, React.ComponentType<{ className?: string }>> = {
  documents: FileText,
  video: Film,
  audio: Music,
  images: ImageIcon,
  'files-dev': FolderArchive,
  'ai-local': Cpu,
  'web-online': Globe,
};

const SKIN_CYCLE: AppSkin[] = ['porcelain', 'carbon', 'swiss'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { t, locale, toggleLocale } = useI18n();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const {
    skin,
    density,
    sidebarCollapsed,
    jobDrawerOpen,
    enabledStudios,
    studioOrder,
    pinnedToolIds,
    updateSetting,
  } = useSettingsStore();

  const isOffline = useSystemStore(selectIsEngineOffline);
  const checking = useSystemStore(selectIsEngineChecking);
  const hasCheckedOnce = useSystemStore(selectHasCheckedEngine);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const immersiveMode = useSystemStore((s) => s.immersiveMode);
  const setImmersiveMode = useSystemStore((s) => s.setImmersiveMode);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);
  const setFeedbackModalOpen = useSystemStore((s) => s.setFeedbackModalOpen);
  const setCommandPaletteOpen = useSystemStore((s) => s.setCommandPaletteOpen);

  const jobs = useJobsStore(selectJobs);
  const streamState = useJobsStore((s) => s.streamState);
  const connectStream = useJobsStore((s) => s.connectStream);
  const disconnectStream = useJobsStore((s) => s.disconnectStream);

  const assets = useWorkspaceStore(selectAssets);
  const loadAssets = useWorkspaceStore((s) => s.loadAssets);
  const initNetworkListeners = useWorkspaceStore((s) => s.initNetworkListeners);

  useEffect(() => {
    useSettingsStore.getState().hydrateFromStorage();
    connectStream();
    initNetworkListeners();
    loadAssets({ silent: true }).catch(() => {});
    registerJobAssetListener(() => {
      loadAssets({ silent: true }).catch(() => {});
    });
    return () => {
      registerJobAssetListener(null);
      disconnectStream();
    };
  }, [connectStream, disconnectStream, initNetworkListeners, loadAssets]);

  // Global Alt+1..9 pinned shortcut navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const digit = Number(e.key);
        if (digit >= 1 && digit <= 9) {
          const toolId = pinnedToolIds[digit - 1];
          if (toolId) {
            const tool = getToolById(toolId);
            if (tool && tool.status === 'active') {
              e.preventDefault();
              router.push(tool.href);
            }
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pinnedToolIds, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const activeJobsMeta = useMemo(() => {
    const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running');
    if (active.length === 0) {
      return { count: 0, avgProgress: 0, allQueued: false };
    }
    const totalPct = active.reduce((sum, j) => sum + Math.max(0, Math.min(100, j.progress || 0)), 0);
    const allQueued = active.every((j) => j.status === 'queued' && (!j.progress || j.progress <= 0));
    return {
      count: active.length,
      avgProgress: Math.round(totalPct / active.length),
      allQueued,
    };
  }, [jobs]);

  const activeJobsCount = activeJobsMeta.count;

  const readyEnginesCount = useMemo(() => {
    const flags = [
      capabilities.ocr,
      capabilities.word_to_pdf,
      capabilities.ffmpeg,
      capabilities.yt_dlp,
      capabilities.rembg_onnx,
      capabilities.whisper_cpu,
    ];
    return flags.filter(Boolean).length;
  }, [capabilities]);

  const orderedEnabledStudios = useMemo(() => {
    const enabledSet = new Set(enabledStudios);
    return studioOrder.filter((id) => enabledSet.has(id));
  }, [enabledStudios, studioOrder]);

  const pinnedTools = useMemo(
    () =>
      pinnedToolIds
        .map((id) => getToolById(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [pinnedToolIds]
  );

  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const matchedTool = useMemo(() => getToolByHref(normalizedPath), [normalizedPath]);
  const activeStudioFromRoute: StudioId | null = useMemo(() => {
    if (normalizedPath.startsWith('/studios/')) {
      const slug = normalizedPath.slice('/studios/'.length) as StudioId;
      if (slug in t.studios) return slug;
    }
    if (normalizedPath === '/video-studio') return 'video';
    if (matchedTool) return matchedTool.studio;
    return null;
  }, [matchedTool, normalizedPath, t.studios]);

  const breadcrumbTrail = useMemo(() => {
    if (normalizedPath === '/') {
      return { studio: null as StudioId | null, leaf: t.nav.home };
    }
    if (normalizedPath.startsWith('/studios/') && activeStudioFromRoute) {
      return { studio: null as StudioId | null, leaf: t.studios[activeStudioFromRoute].name };
    }
    if (normalizedPath === '/workspace') return { studio: null, leaf: t.nav.workspace };
    if (normalizedPath === '/pipelines') return { studio: null, leaf: t.nav.pipelines };
    if (normalizedPath === '/roadmap') return { studio: null, leaf: t.nav.roadmap };
    if (normalizedPath === '/settings') return { studio: null, leaf: t.nav.settings };
    if (normalizedPath === '/privacidad') return { studio: null, leaf: 'Privacidad' };
    if (normalizedPath === '/terminos') return { studio: null, leaf: 'Licencia Apache 2.0' };
    if (matchedTool) {
      return {
        studio: matchedTool.studio,
        leaf: t.tools[matchedTool.id]?.name ?? matchedTool.id,
      };
    }
    return { studio: null, leaf: normalizedPath.replace('/', '') };
  }, [activeStudioFromRoute, matchedTool, normalizedPath, t]);

  const handleCycleSkin = () => {
    const currentIdx = SKIN_CYCLE.indexOf(skin === 'system' ? 'porcelain' : skin);
    const nextSkin = SKIN_CYCLE[(currentIdx + 1) % SKIN_CYCLE.length];
    updateSetting('skin', nextSkin);
  };

  const handleCycleDensity = () => {
    const order: ('compact' | 'standard' | 'comfortable')[] = [
      'standard',
      'comfortable',
      'compact',
    ];
    const next = order[(order.indexOf(density) + 1) % order.length];
    updateSetting('density', next);
  };

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="h-14 px-3 border-b border-[var(--border)] flex items-center justify-between gap-2 shrink-0">
        <Link
          href="/"
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-2.5 min-w-0 focus-visible:outline-none"
        >
          <TornioEmblem className="w-7 h-7 shrink-0" />
          {!collapsed && (
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-sm font-bold tracking-tight text-[var(--fg)] truncate">
                {t.brand.name}
              </span>
              <span className="text-[10px] font-mono text-[var(--fg-muted)]">v3</span>
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => updateSetting('sidebarCollapsed', !sidebarCollapsed)}
          title={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          className="hidden lg:inline-flex p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label={t.common.close}
          className="lg:hidden p-1.5 rounded-[var(--radius-control)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5 scrollbar-thin">
        <nav className="space-y-1" aria-label="Primary navigation">
          {[
            {
              href: '/',
              label: t.nav.home,
              icon: Home,
              active: normalizedPath === '/',
              onClick: () => setMobileNavOpen(false),
            },
            {
              href: '/workspace',
              label: t.nav.workspace,
              icon: Inbox,
              active: pathname === '/workspace',
              badge: assets.length > 0 ? assets.length : undefined,
            },
            {
              href: '/pipelines',
              label: t.nav.pipelines,
              icon: Workflow,
              active: pathname === '/pipelines',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                title={collapsed ? item.label : undefined}
                className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                  item.active
                    ? 'bg-[var(--accent-soft)] text-[var(--fg)] border border-[var(--accent-border)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
                {!collapsed && item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--fg)]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Dynamic Enabled Studios */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              {t.nav.studiosSection}
            </div>
          )}
          {orderedEnabledStudios.map((studioId) => {
            const Icon = STUDIO_ICONS[studioId];
            const isActive = activeStudioFromRoute === studioId;
            const palette = STUDIO_PALETTES[studioId];
            return (
              <Link
                key={studioId}
                href={`/studios/${studioId}`}
                onClick={() => setMobileNavOpen(false)}
                title={collapsed ? t.studios[studioId].name : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--fg)] border border-[var(--accent-border)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] border border-transparent'
                }`}
              >
                <span style={isActive ? { color: palette.primary } : undefined}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </span>
                {!collapsed && (
                  <span className="truncate">{t.studios[studioId].name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Pinned Shortcuts */}
        {!collapsed && pinnedTools.length > 0 && (
          <div className="space-y-1">
            <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              <span className="flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" />
                {t.nav.pinnedSection}
              </span>
              <span className="font-mono">Alt+1..9</span>
            </div>
            {pinnedTools.map((tool, index) => {
              const active = pathname === tool.href;
              return (
                <Link
                  key={tool.id}
                  href={tool.status === 'active' ? tool.href : `/roadmap#${tool.id}`}
                  className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[var(--radius-control)] text-xs transition-colors ${
                    active
                      ? 'bg-[var(--surface-muted)] text-[var(--fg)] font-semibold'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <span className="truncate">{t.tools[tool.id]?.name ?? tool.id}</span>
                  <kbd className="px-1 py-0.2 rounded text-[9px] font-mono border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] shrink-0">
                    {index + 1}
                  </kbd>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Compact Motores & Settings Links */}
      <div className="p-2.5 border-t border-[var(--border)] space-y-1 shrink-0">
        <button
          type="button"
          onClick={() => setModulesModalOpen(true)}
          title={collapsed ? t.nav.enginesLabel : undefined}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--radius-control)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <Blocks className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{t.nav.enginesLabel}</span>}
          </span>
          {!collapsed && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)]">
              {readyEnginesCount}/6
            </span>
          )}
        </button>

        <Link
          href="/settings"
          title={collapsed ? t.nav.settings : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-control)] text-xs font-medium transition-colors ${
            pathname === '/settings'
              ? 'bg-[var(--accent-soft)] text-[var(--fg)] border border-[var(--accent-border)]'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">{t.nav.settings}</span>}
        </Link>

        <button
          type="button"
          onClick={() => {
            setMobileNavOpen(false);
            setFeedbackModalOpen(true);
          }}
          title={collapsed ? t.nav.suggestFeedback : undefined}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-control)] text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-muted)] transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">{t.nav.suggestFeedback}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      <TopProgressBar />
      <SystemStatusPoller />
      <UpdateBanner />

      <div className="flex-1 flex min-h-0">
        {!immersiveMode && (
          <aside
            className={`hidden lg:flex flex-col border-r border-[var(--border)] bg-[var(--surface)] shrink-0 sticky top-0 h-screen transition-[width] duration-200 ${
              sidebarCollapsed ? 'w-[64px]' : 'w-60'
            }`}
          >
            {renderSidebarContent(sidebarCollapsed)}
          </aside>
        )}

        {mobileNavOpen && !immersiveMode && (
          <div
            className="fixed inset-0 z-50 lg:hidden flex bg-black/50 backdrop-blur-[1px]"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileNavOpen(false);
            }}
          >
            <aside className="w-64 h-full bg-[var(--surface)] border-r border-[var(--border)]">
              {renderSidebarContent(false)}
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          {!immersiveMode ? (
            <header className="sticky top-0 z-30 h-14 px-3 sm:px-5 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation menu"
                  className="lg:hidden p-1.5 rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface-muted)]"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 text-xs min-w-0">
                  <Link
                    href="/"
                    className="font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors whitespace-nowrap"
                  >
                    {t.brand.name}
                  </Link>
                  <span className="text-[var(--border-strong)]">/</span>
                  {breadcrumbTrail.studio && (
                    <>
                      <Link
                        href={`/studios/${breadcrumbTrail.studio}`}
                        className="font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors truncate"
                      >
                        {t.studios[breadcrumbTrail.studio].name}
                      </Link>
                      <span className="text-[var(--border-strong)]">/</span>
                    </>
                  )}
                  <span className="font-semibold text-[var(--fg)] truncate">
                    {breadcrumbTrail.leaf}
                  </span>
                </div>
              </div>

              {/* Single-Line TopBar Utility Cluster with ONE canonical Engine Status indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {normalizedPath !== '/' && (
                  <button
                    type="button"
                    onClick={() => setCommandPaletteOpen(true)}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors whitespace-nowrap"
                  >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">{t.nav.searchTrigger}</span>
                    <kbd className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)]">
                      Ctrl+K
                    </kbd>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setModulesModalOpen(true)}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-control)] border text-xs font-medium whitespace-nowrap transition-colors ${
                    isOffline
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      checking && !hasCheckedOnce
                        ? 'bg-zinc-400 animate-pulse'
                        : isOffline
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
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

                <button
                  type="button"
                  onClick={handleCycleDensity}
                  title={`${t.settings.appearance.densityLabel}: ${t.settings.appearance.densities[density]}`}
                  aria-label={t.settings.appearance.densityLabel}
                  className="inline-flex items-center justify-center px-2 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-[11px] font-mono font-semibold text-[var(--fg)] whitespace-nowrap transition-colors"
                >
                  {density === 'comfortable' ? 'A+' : density === 'compact' ? 'A-' : 'A'}
                </button>

                <button
                  type="button"
                  onClick={toggleLocale}
                  title={t.nav.languageToggle}
                  aria-label={t.nav.languageToggle}
                  className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-[11px] font-mono font-semibold text-[var(--fg)] whitespace-nowrap transition-colors"
                >
                  {locale.toUpperCase()}
                </button>

                <button
                  type="button"
                  onClick={handleCycleSkin}
                  title={`${t.nav.skinToggle} (${t.nav.skins[skin]})`}
                  aria-label={t.nav.skinToggle}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs text-[var(--fg)] whitespace-nowrap transition-colors"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline text-[11px] font-medium">
                    {t.nav.skins[skin]}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSetting('jobDrawerOpen', !jobDrawerOpen)}
                  aria-label={t.nav.jobQueue}
                  title={t.nav.jobQueue}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-control)] border text-xs font-medium whitespace-nowrap transition-colors ${
                    jobDrawerOpen
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-[var(--fg)]'
                  }`}
                >
                  {activeJobsCount > 0 ? (
                    <ProgressRing
                      size={16}
                      value={activeJobsMeta.allQueued ? undefined : activeJobsMeta.avgProgress}
                      indeterminate={activeJobsMeta.allQueued}
                    />
                  ) : streamState === 'connecting' || streamState === 'reconnecting' ? (
                    <PulseDots size="sm" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="hidden md:inline">{t.nav.jobQueue}</span>
                  {(activeJobsCount > 0 || jobs.length > 0) && (
                    <span
                      className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold"
                      style={
                        activeJobsCount > 0
                          ? { backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }
                          : { backgroundColor: 'var(--surface-muted)', color: 'var(--fg)' }
                      }
                    >
                      {activeJobsCount > 0 ? activeJobsCount : jobs.length}
                    </span>
                  )}
                </button>
              </div>
            </header>
          ) : (
            <div className="fixed top-3 right-3 z-40">
              <button
                type="button"
                onClick={() => setImmersiveMode(false)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--fg)] shadow-sm"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>{t.commandPalette.actions.immersiveOff.label}</span>
              </button>
            </div>
          )}

          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>

        <div className={`${jobDrawerOpen ? 'lg:sticky lg:top-0 lg:h-screen' : ''}`}>
          <JobQueueDrawer
            open={jobDrawerOpen}
            onClose={() => updateSetting('jobDrawerOpen', false)}
          />
        </div>
      </div>

      <ModulesModal />
      <UpdateModal />
      <QuickFeedbackModal />
      <CommandPalette />
    </div>
  );
}
