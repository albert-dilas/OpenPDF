'use client';

import React from 'react';
import { Play, RotateCcw, Scissors } from 'lucide-react';
import { formatDuration } from '@/lib/api';
import { useI18n } from '@/i18n';

interface VideoTrimControlsProps {
  durationSec: number;
  startSec: number;
  endSec: number;
  onStartChange: (val: number) => void;
  onEndChange: (val: number) => void;
  onPreviewRange: () => void;
  onJumpIn: () => void;
  onJumpOut: () => void;
  onReset: () => void;
}

export default function VideoTrimControls({
  durationSec,
  startSec,
  endSec,
  onStartChange,
  onEndChange,
  onPreviewRange,
  onJumpIn,
  onJumpOut,
  onReset,
}: VideoTrimControlsProps) {
  const { t } = useI18n();

  const startPct = durationSec > 0 ? (startSec / durationSec) * 100 : 0;
  const endPct = durationSec > 0 ? (endSec / durationSec) * 100 : 100;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fg)]">
          <Scissors className="w-4 h-4" />
          <span>{t.videoStudio.trimSection}</span>
        </div>
        <span className="text-xs font-mono text-[var(--fg-muted)]">
          {t.videoStudio.trimDuration}:{' '}
          <strong className="text-[var(--fg)]">
            {formatDuration(Math.max(0, endSec - startSec))}
          </strong>
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] overflow-hidden">
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${Math.max(0, Math.min(100, startPct))}%`,
            width: `${Math.max(0, Math.min(100, endPct - startPct))}%`,
            backgroundColor: 'var(--accent)',
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--fg-muted)]">{t.videoStudio.trimIn}</span>
            <span className="font-mono font-semibold text-[var(--fg)]">
              {startSec.toFixed(2)}s ({formatDuration(startSec)})
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0.2, durationSec)}
            step={0.1}
            value={startSec}
            disabled={durationSec <= 0}
            onChange={(e) => onStartChange(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--fg-muted)]">{t.videoStudio.trimOut}</span>
            <span className="font-mono font-semibold text-[var(--fg)]">
              {endSec.toFixed(2)}s ({formatDuration(endSec)})
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0.2, durationSec)}
            step={0.1}
            value={endSec}
            disabled={durationSec <= 0}
            onChange={(e) => onEndChange(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={durationSec <= 0}
          onClick={onPreviewRange}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--fg)] disabled:opacity-40"
        >
          <Play className="w-3.5 h-3.5" />
          {t.videoStudio.previewRange}
        </button>
        <button
          type="button"
          onClick={onJumpIn}
          className="px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          {t.videoStudio.jumpIn}
        </button>
        <button
          type="button"
          onClick={onJumpOut}
          className="px-2.5 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          {t.videoStudio.jumpOut}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t.videoStudio.resetTrim}
        </button>
      </div>
    </div>
  );
}
