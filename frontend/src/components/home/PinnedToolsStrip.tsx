'use client';

import React from 'react';
import Link from 'next/link';
import ToolIcon from '@/components/ui/ToolIcon';
import SectionHeader from '@/components/ui/SectionHeader';
import { getToolById, StudioToolItem } from '@/config/studios';
import { STUDIO_PALETTES } from '@/lib/studio-palettes';
import { useI18n } from '@/i18n';

interface PinnedToolsStripProps {
  pinnedToolIds: string[];
}

export default function PinnedToolsStrip({ pinnedToolIds }: PinnedToolsStripProps) {
  const { t } = useI18n();

  const activePinned: { tool: StudioToolItem; shortcutDigit: number }[] = [];
  pinnedToolIds.forEach((id, idx) => {
    const tool = getToolById(id);
    if (tool && tool.status === 'active' && activePinned.length < 4) {
      activePinned.push({ tool, shortcutDigit: idx + 1 });
    }
  });

  return (
    <section className="space-y-3.5">
      <SectionHeader
        title={t.home.pinnedTitle}
        subtitle={t.home.pinnedSubtitle}
        actions={
          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/studios/documents"
              className="font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              {t.home.browseDocuments}
            </Link>
            <Link
              href="/settings"
              className="font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            >
              {t.home.managePins}
            </Link>
          </div>
        }
      />

      {activePinned.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activePinned.map(({ tool, shortcutDigit }) => {
            const copy = t.tools[tool.id];
            const pal = STUDIO_PALETTES[tool.studio];
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] p-3.5 flex items-center justify-between gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ToolIcon
                    tool={{
                      iconName: tool.iconName,
                      studioId: tool.studio,
                      name: copy?.name,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[var(--fg)] truncate block">
                      {copy?.name ?? tool.id}
                    </span>
                    <span
                      className="text-[11px] truncate block"
                      style={{ color: pal.primary }}
                    >
                      {t.studios[tool.studio].name}
                    </span>
                  </div>
                </div>

                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] shrink-0">
                  Alt+{shortcutDigit}
                </kbd>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
