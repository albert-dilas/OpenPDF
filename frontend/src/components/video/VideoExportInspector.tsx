'use client';

import React from 'react';
import {
  Film,
  SlidersHorizontal,
  VolumeX,
  Zap,
} from 'lucide-react';
import { AsyncButton } from '@/components/ui/Loaders';
import {
  JobRecord,
  VideoOutputFormat,
  VideoQualityPreset,
  VideoResolutionPreset,
} from '@/lib/api';
import { isMutationPending, MutationState } from '@/lib/fsm';
import { useI18n } from '@/i18n';

interface VideoExportInspectorProps {
  outputFormat: VideoOutputFormat;
  quality: VideoQualityPreset;
  resolution: VideoResolutionPreset;
  removeAudio: boolean;
  fastCopy: boolean;
  ffmpegReady: boolean;
  dispatchState: MutationState<JobRecord>;
  onFormatChange: (fmt: VideoOutputFormat) => void;
  onQualityChange: (q: VideoQualityPreset) => void;
  onResolutionChange: (r: VideoResolutionPreset) => void;
  onRemoveAudioChange: (v: boolean) => void;
  onFastCopyChange: (v: boolean) => void;
  onDispatch: () => void;
}

export default function VideoExportInspector({
  outputFormat,
  quality,
  resolution,
  removeAudio,
  fastCopy,
  ffmpegReady,
  dispatchState,
  onFormatChange,
  onQualityChange,
  onResolutionChange,
  onRemoveAudioChange,
  onFastCopyChange,
  onDispatch,
}: VideoExportInspectorProps) {
  const { t } = useI18n();
  const fastCopyDisabled = outputFormat === 'gif' || outputFormat === 'webm';
  const dispatching = isMutationPending(dispatchState);

  return (
    <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
      <div className="p-5 border-b border-[var(--border)] flex items-center gap-2.5">
        <SlidersHorizontal className="w-4 h-4 text-[var(--fg)]" />
        <h2 className="text-sm font-semibold text-[var(--fg)]">
          {t.videoStudio.inspectorTitle}
        </h2>
      </div>

      <div className="p-5 flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            {t.videoStudio.outputFormat}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['mp4', 'webm', 'mkv', 'gif'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onFormatChange(fmt)}
                className={`py-2 rounded-[var(--radius-control)] border text-xs font-mono font-semibold uppercase transition-colors ${
                  outputFormat === fmt
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="video-quality"
            className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]"
          >
            {t.videoStudio.qualityLabel}
          </label>
          <select
            id="video-quality"
            value={quality}
            onChange={(e) => onQualityChange(e.target.value as VideoQualityPreset)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="high">{t.videoStudio.qualities.high}</option>
            <option value="medium">{t.videoStudio.qualities.medium}</option>
            <option value="compact">{t.videoStudio.qualities.compact}</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="video-resolution"
            className="block text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)]"
          >
            {t.videoStudio.resolutionLabel}
          </label>
          <select
            id="video-resolution"
            value={resolution}
            onChange={(e) => onResolutionChange(e.target.value as VideoResolutionPreset)}
            className="w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="original">{t.videoStudio.resolutions.original}</option>
            <option value="1080">{t.videoStudio.resolutions['1080']}</option>
            <option value="720">{t.videoStudio.resolutions['720']}</option>
            <option value="480">{t.videoStudio.resolutions['480']}</option>
          </select>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-start gap-3 p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] cursor-pointer">
            <input
              type="checkbox"
              checked={removeAudio}
              onChange={(e) => onRemoveAudioChange(e.target.checked)}
              className="mt-0.5 rounded border-[var(--border-strong)]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5" />
                {t.videoStudio.removeAudio}
              </span>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {t.videoStudio.removeAudioHint}
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-3 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] ${
              fastCopyDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={fastCopy && !fastCopyDisabled}
              disabled={fastCopyDisabled}
              onChange={(e) => onFastCopyChange(e.target.checked)}
              className="mt-0.5 rounded border-[var(--border-strong)]"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                {t.videoStudio.fastCopy}
              </span>
              <p className="text-[11px] text-[var(--fg-muted)]">
                {t.videoStudio.fastCopyHint}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="p-5 border-t border-[var(--border)] bg-[var(--bg)]">
        <AsyncButton
          pending={dispatching}
          disabled={!ffmpegReady}
          onClick={onDispatch}
          icon={<Film className="w-4 h-4" />}
          pendingLabel={t.videoStudio.dispatchingBtn}
          className="w-full py-3.5 rounded-[var(--radius-control)] text-sm font-semibold hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-fg)',
          }}
        >
          {t.videoStudio.dispatchBtn}
        </AsyncButton>
      </div>
    </aside>
  );
}
