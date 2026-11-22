'use client';

import React from 'react';
import StudioTile3D from '@/components/shell/StudioTile3D';
import SectionHeader from '@/components/ui/SectionHeader';
import { StudioId } from '@/config/studios';
import { ThreeDLevel, WorkspaceProfileId } from '@/lib/appearance';
import { useI18n } from '@/i18n';

interface StudioLauncherGridProps {
  studioIds: StudioId[];
  threeDLevel: ThreeDLevel;
  reduceAnimations: boolean;
  workspaceProfile: WorkspaceProfileId;
  onSelectProfile: (profileId: WorkspaceProfileId) => void;
  onSelectStudio: (studioId: StudioId) => void;
}

const PROFILE_IDS: WorkspaceProfileId[] = [
  'all',
  'office',
  'student',
  'creator',
  'developer',
];

export default function StudioLauncherGrid({
  studioIds,
  threeDLevel,
  reduceAnimations,
  workspaceProfile,
  onSelectProfile,
  onSelectStudio,
}: StudioLauncherGridProps) {
  const { t } = useI18n();

  return (
    <section className="space-y-4">
      <SectionHeader
        title={t.home.quickLaunchTitle}
        subtitle={t.home.quickLaunchSubtitle}
        actions={
          <div className="flex items-center gap-1 flex-wrap">
            {PROFILE_IDS.map((profId) => {
              const active = workspaceProfile === profId;
              return (
                <button
                  key={profId}
                  type="button"
                  onClick={() => onSelectProfile(profId)}
                  className={`px-2.5 py-1 rounded-[var(--radius-control)] border text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)] font-semibold'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {t.home.profiles[profId]}
                </button>
              );
            })}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {studioIds.map((studioId) => {
          const copy = t.studios[studioId];
          return (
            <StudioTile3D
              key={studioId}
              studioId={studioId}
              title={copy.name}
              tagline={copy.tagline}
              threeDLevel={threeDLevel}
              reduceAnimations={reduceAnimations}
              onClick={() => onSelectStudio(studioId)}
            />
          );
        })}
      </div>
    </section>
  );
}
