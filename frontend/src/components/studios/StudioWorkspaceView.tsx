'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Blocks, Globe, Pin } from 'lucide-react';
import { SculptedStudioGlyph } from '@/components/shell/StudioTile3D';
import ToolIcon from '@/components/ui/ToolIcon';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  getToolsByStudio,
  ModuleRequirement,
  StudioId,
  StudioToolItem,
} from '@/config/studios';
import { STUDIO_PALETTES } from '@/lib/studio-palettes';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  selectEngineCapabilities,
  selectHasCheckedEngine,
  selectIsEngineOnline,
  useSystemStore,
} from '@/store/useSystemStore';
import { useI18n } from '@/i18n';

const DOCUMENT_CATEGORY_ORDER = [
  'organizar',
  'optimizar',
  'convertir',
  'editar',
  'seguridad',
] as const;

export default function StudioWorkspaceView({ studioId }: { studioId: StudioId }) {
  const { t } = useI18n();
  const palette = STUDIO_PALETTES[studioId];
  const studioCopy = t.studios[studioId];

  const pinnedToolIds = useSettingsStore((s) => s.pinnedToolIds);
  const togglePinTool = useSettingsStore((s) => s.togglePinTool);
  const density = useSettingsStore((s) => s.density);

  const capabilities = useSystemStore(selectEngineCapabilities);
  const hasCheckedEngine = useSystemStore(selectHasCheckedEngine);
  const engineOnline = useSystemStore(selectIsEngineOnline);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);
  const setFeedbackModalOpen = useSystemStore((s) => s.setFeedbackModalOpen);

  const tools = useMemo(() => getToolsByStudio(studioId), [studioId]);
  const isCompact = density === 'compact';

  const requiredEngines = useMemo(() => {
    const seen = new Set<ModuleRequirement>();
    for (const item of tools) {
      if (item.requiredCapability) seen.add(item.requiredCapability);
    }
    return Array.from(seen);
  }, [tools]);

  const groupedTools = useMemo(() => {
    if (studioId !== 'documents') {
      return [{ key: 'all', label: t.home.studioToolsSection, items: tools }];
    }
    const groups: { key: string; label: string; items: StudioToolItem[] }[] = [];
    for (const cat of DOCUMENT_CATEGORY_ORDER) {
      const matching = tools.filter((item) => item.category === cat);
      if (matching.length > 0) {
        groups.push({
          key: cat,
          label: t.categories[cat] ?? cat,
          items: matching,
        });
      }
    }
    return groups;
  }, [studioId, t.categories, t.home.studioToolsSection, tools]);

  const renderToolCard = (tool: StudioToolItem) => {
    const copy = t.tools[tool.id];
    const isActive = tool.status === 'active';
    const isPinned = pinnedToolIds.includes(tool.id);
    const missingCap =
      tool.requiredCapability &&
      hasCheckedEngine &&
      engineOnline &&
      !capabilities[tool.requiredCapability];

    const cardBody = (
      <div
        className={`group relative h-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] transition-colors flex flex-col justify-between ${
          isActive
            ? 'hover:border-[var(--border-strong)]'
            : 'opacity-80 bg-[var(--surface)]/70'
        } ${isCompact ? 'p-3.5 gap-2.5' : 'p-4 gap-3.5'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <ToolIcon
            tool={{
              iconName: tool.iconName,
              studioId: tool.studio,
              name: copy?.name,
            }}
            size={isCompact ? 'sm' : 'md'}
          />

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tool.requiresInternet && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300">
                <Globe className="w-2.5 h-2.5" />
                {t.common.online}
              </span>
            )}

            {!isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--fg-muted)]">
                {tool.phaseTarget || t.common.phase2}
              </span>
            )}

            {isActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  togglePinTool(tool.id);
                }}
                title={isPinned ? t.common.unpinShortcut : t.common.pinShortcut}
                aria-label={isPinned ? t.common.unpinShortcut : t.common.pinShortcut}
                className={`p-1 rounded-[var(--radius-control)] border transition-all ${
                  isPinned
                    ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--fg)] opacity-100'
                    : 'border-transparent text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--fg)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                <Pin className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--fg)] tracking-tight truncate">
            {copy?.name ?? tool.id}
          </h3>
          <p className="text-xs text-[var(--fg-muted)] leading-relaxed line-clamp-2">
            {copy?.description ?? ''}
          </p>
        </div>

        {missingCap && tool.requiredCapability && (
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 text-[11px]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setModulesModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              <Blocks className="w-3 h-3" />
              <span>{t.modulesModal.items[tool.requiredCapability].shortTitle}</span>
            </button>
            <span className="text-[10px] font-mono text-[var(--fg-muted)]">
              {t.common.pending}
            </span>
          </div>
        )}
      </div>
    );

    if (!isActive) {
      return <div key={tool.id}>{cardBody}</div>;
    }

    return (
      <Link
        key={tool.id}
        href={tool.href}
        className="block rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        {cardBody}
      </Link>
    );
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      {/* Studio Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.common.backHome}</span>
        </Link>

        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary}, transparent)`,
            }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2 rounded-full blur-xl opacity-55"
                  style={{ background: palette.glow }}
                />
                <div className="relative">
                  <SculptedStudioGlyph studioId={studioId} size="lg" />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--fg)]">
                  {studioCopy.name}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--fg-muted)] max-w-2xl leading-relaxed">
                  {studioCopy.description}
                </p>
              </div>
            </div>

            {requiredEngines.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {requiredEngines.map((engineId) => {
                  const ready = capabilities[engineId];
                  return (
                    <button
                      key={engineId}
                      type="button"
                      onClick={() => setModulesModalOpen(true)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-control)] border text-xs font-medium transition-colors ${
                        ready
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ready ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{t.modulesModal.items[engineId].shortTitle}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Video Workbench Banner on Video Studio */}
      {studioId === 'video' && (
        <Link
          href="/video-studio"
          className="group relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--surface)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ borderColor: palette.border }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <ToolIcon
              tool={{ iconName: 'film', studioId: 'video', name: t.videoStudio.title }}
              size="lg"
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--fg)]">
                {t.home.openVideoWorkbench}
              </h2>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                {t.home.videoWorkbenchHint}
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center justify-center px-4 py-2 rounded-[var(--radius-control)] text-xs font-semibold shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {t.videoStudio.title}
          </span>
        </Link>
      )}

      {/* Studio Tools Grid (grouped on documents) */}
      <div className="space-y-6">
        {groupedTools.map((group) => (
          <section key={group.key} className="space-y-3">
            <SectionHeader title={group.label} />
            <div
              className={`grid ${
                isCompact
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
              }`}
            >
              {group.items.map(renderToolCard)}
            </div>
          </section>
        ))}
      </div>

      {/* Subtle Studio Evolution & Community Proposals Strip */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <p className="text-[var(--fg-muted)]">{t.home.studioEvolutionNotice}</p>
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            className="font-semibold text-[var(--fg)] hover:underline"
          >
            {t.home.proposeToolBtn}
          </button>
          <Link
            href="/roadmap"
            className="font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:underline"
          >
            {t.home.viewRoadmapLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
