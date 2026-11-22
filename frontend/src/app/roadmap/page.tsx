'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Compass, CheckCircle2, Clock, ArrowUpRight, Blocks, MessageSquarePlus } from 'lucide-react';
import {
  ALL_STUDIO_TOOLS,
  DEFAULT_STUDIO_ORDER,
  getToolsByStudio,
  StudioId,
} from '@/config/studios';
import { selectEngineCapabilities, useSystemStore } from '@/store/useSystemStore';
import { useI18n } from '@/i18n';

export default function RoadmapPage() {
  const { t, locale } = useI18n();
  const capabilities = useSystemStore(selectEngineCapabilities);
  const setModulesModalOpen = useSystemStore((s) => s.setModulesModalOpen);
  const setFeedbackModalOpen = useSystemStore((s) => s.setFeedbackModalOpen);
  const [studioFilter, setStudioFilter] = useState<StudioId | 'all'>('all');

  const activeCount = useMemo(
    () => ALL_STUDIO_TOOLS.filter((item) => item.status === 'active').length,
    []
  );
  const phase2Count = ALL_STUDIO_TOOLS.length - activeCount;

  const visibleStudios =
    studioFilter === 'all' ? DEFAULT_STUDIO_ORDER : [studioFilter];

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">
              {t.roadmap.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--fg-muted)] mt-1">
              {t.roadmap.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFeedbackModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] text-xs font-medium text-[var(--fg)] transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            {locale === 'en' ? 'Suggest tool' : 'Proponer herramienta'}
          </button>

          <button
            type="button"
            onClick={() => setModulesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)]"
          >
            <Blocks className="w-3.5 h-3.5" />
            {t.settings.modules.openCenterBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
          <span className="text-[11px] font-mono uppercase text-[var(--fg-muted)]">
            {t.roadmap.activeNow}
          </span>
          <p className="text-2xl font-bold font-mono text-[var(--fg)] mt-1">{activeCount}</p>
        </div>
        <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
          <span className="text-[11px] font-mono uppercase text-[var(--fg-muted)]">
            {phase2Count === 0
              ? locale === 'en'
                ? 'Integrated Studios'
                : 'Estudios integrados'
              : t.roadmap.upcomingPhase2}
          </span>
          <p className="text-2xl font-bold font-mono text-[var(--fg)] mt-1">
            {phase2Count === 0 ? DEFAULT_STUDIO_ORDER.length : phase2Count}
          </p>
        </div>
        <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]">
          <span className="text-[11px] font-mono uppercase text-[var(--fg-muted)]">
            {t.roadmap.totalManifest}
          </span>
          <p className="text-2xl font-bold font-mono text-[var(--fg)] mt-1">
            {ALL_STUDIO_TOOLS.length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStudioFilter('all')}
          className={`px-3 py-1.5 rounded-[var(--radius-control)] border text-xs font-medium whitespace-nowrap ${
            studioFilter === 'all'
              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)]'
          }`}
        >
          {t.roadmap.filterAll}
        </button>
        {DEFAULT_STUDIO_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setStudioFilter(id)}
            className={`px-3 py-1.5 rounded-[var(--radius-control)] border text-xs font-medium whitespace-nowrap ${
              studioFilter === id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)]'
            }`}
          >
            {t.studios[id].name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {visibleStudios.map((studioId) => {
          const studioTools = getToolsByStudio(studioId);
          return (
            <section
              key={studioId}
              className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-base font-bold text-[var(--fg)]">
                    {t.studios[studioId].name}
                  </h2>
                  <p className="text-xs text-[var(--fg-muted)]">
                    {t.studios[studioId].description}
                  </p>
                </div>
                <span className="text-xs font-mono text-[var(--fg-muted)]">
                  {studioTools.length} {t.home.toolsCountSuffix}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {studioTools.map((tool) => {
                  const isActive = tool.status === 'active';
                  const copy = t.tools[tool.id];
                  const engineReady = tool.requiredCapability
                    ? capabilities[tool.requiredCapability]
                    : true;

                  const content = (
                    <div
                      id={tool.id}
                      className="p-3.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] transition-colors space-y-2 h-full flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--fg)] truncate">
                            {copy?.name ?? tool.id}
                          </span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {t.common.active}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {tool.phaseTarget || 'v3.1'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                          {copy?.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--fg-muted)] pt-2 border-t border-[var(--border)]">
                        <span>
                          {tool.requiredCapability
                            ? t.modulesModal.items[tool.requiredCapability].shortTitle
                            : 'Core'}
                        </span>
                        {tool.requiredCapability ? (
                          <span
                            className={
                              engineReady
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {engineReady ? t.common.ready : t.common.pending}
                          </span>
                        ) : isActive ? (
                          <ArrowUpRight className="w-3 h-3 text-[var(--fg)]" />
                        ) : null}
                      </div>
                    </div>
                  );

                  if (isActive) {
                    return (
                      <Link key={tool.id} href={tool.href} className="block">
                        {content}
                      </Link>
                    );
                  }
                  return <div key={tool.id}>{content}</div>;
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
