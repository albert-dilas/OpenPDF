'use client';

import React from 'react';
import { PulseDots, SkeletonMetadataGrid } from '@/components/ui/Loaders';
import { formatDuration, VideoMetadataSummary } from '@/lib/api';
import { AsyncResourceState, getResourceData } from '@/lib/fsm';
import { useI18n } from '@/i18n';

interface VideoMetadataStripProps {
  probeState: AsyncResourceState<VideoMetadataSummary>;
  durationSec: number;
}

export default function VideoMetadataStrip({
  probeState,
  durationSec,
}: VideoMetadataStripProps) {
  const { t } = useI18n();
  const metadata = getResourceData(probeState) ?? null;
  const probing =
    probeState.status === 'loading' || probeState.status === 'revalidating';

  const resolvedWidth =
    typeof metadata?.width === 'number' ? metadata.width : null;
  const resolvedHeight =
    typeof metadata?.height === 'number' ? metadata.height : null;
  const resolvedFps =
    typeof metadata?.fps === 'number' ? Number(metadata.fps).toFixed(2) : null;
  const resolvedBitrate =
    typeof metadata?.bitrate_kbps === 'number'
      ? `${Math.round(metadata.bitrate_kbps)} kbps`
      : typeof metadata?.bit_rate === 'number'
      ? `${Math.round(metadata.bit_rate / 1000)} kbps`
      : typeof metadata?.bitrate === 'number'
      ? `${Math.round(metadata.bitrate / 1000)} kbps`
      : null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)]">
          {t.videoStudio.metadataTitle}
        </h2>
        {probing && (
          <span className="inline-flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <PulseDots size="sm" />
            {t.videoStudio.inspectingMeta}
          </span>
        )}
      </div>

      {probeState.status === 'loading' ? (
        <SkeletonMetadataGrid columns={6} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {[
            {
              label: t.videoStudio.duration,
              value: durationSec > 0 ? formatDuration(durationSec) : '--',
            },
            {
              label: t.videoStudio.resolution,
              value:
                resolvedWidth && resolvedHeight
                  ? `${resolvedWidth}x${resolvedHeight}`
                  : '--',
            },
            { label: t.videoStudio.fps, value: resolvedFps ? `${resolvedFps}` : '--' },
            {
              label: t.videoStudio.videoCodec,
              value: metadata?.video_codec ? String(metadata.video_codec) : '--',
            },
            {
              label: t.videoStudio.audioCodec,
              value:
                metadata?.has_audio === false
                  ? t.videoStudio.noAudioTrack
                  : metadata?.audio_codec
                  ? String(metadata.audio_codec)
                  : '--',
            },
            { label: t.videoStudio.bitrate, value: resolvedBitrate ?? '--' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]"
            >
              <span className="block text-[10px] text-[var(--fg-muted)]">{item.label}</span>
              <span className="font-mono font-semibold text-[var(--fg)] truncate block mt-0.5">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
