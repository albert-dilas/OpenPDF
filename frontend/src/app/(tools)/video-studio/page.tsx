'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { CapabilityWarningBanner } from '@/components/system/SystemStatus';
import FileDropZone from '@/components/ui/FileDropZone';
import VideoTrayPicker from '@/components/video/VideoTrayPicker';
import VideoStage from '@/components/video/VideoStage';
import VideoTrimControls from '@/components/video/VideoTrimControls';
import VideoMetadataStrip from '@/components/video/VideoMetadataStrip';
import VideoExportInspector from '@/components/video/VideoExportInspector';
import {
  ACCEPTED_VIDEO_EXTS,
  useVideoStudioController,
} from '@/hooks/useVideoStudioController';
import { formatBytes } from '@/lib/api';
import { useI18n } from '@/i18n';

export default function VideoStudioPage() {
  const { t } = useI18n();
  const c = useVideoStudioController();

  if (!c.videoSrc) {
    return (
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.common.backHome}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--fg)] tracking-tight">
            {t.videoStudio.title}
          </h1>
          <p className="text-sm text-[var(--fg-muted)] max-w-xl mx-auto">
            {t.videoStudio.subtitle}
          </p>
        </div>

        <CapabilityWarningBanner capability="ffmpeg" />

        <FileDropZone
          variant="canvas"
          interactionState="idle"
          accept={ACCEPTED_VIDEO_EXTS.join(',')}
          multiple={false}
          onFilesSelected={(files) => files[0] && c.loadLocalVideoFile(files[0])}
          title={t.videoStudio.emptyTitle}
          subtitle={t.videoStudio.emptySubtitle}
          buttonLabel={t.videoStudio.uploadVideoBtn}
          hint="MP4 · MOV · MKV · WebM · AVI"
        />

        <VideoTrayPicker assets={c.videoTrayAssets} onSelect={c.loadTrayVideoAsset} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common.backHome}
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--fg)]">{t.videoStudio.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)]">
                {c.activeName} · {formatBytes(c.activeSize)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={c.resetSource}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] hover:border-red-500/50 hover:text-red-500 text-xs font-medium text-[var(--fg)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.videoStudio.changeVideo}
          </button>
        </div>

        <CapabilityWarningBanner capability="ffmpeg" />

        <VideoStage
          videoRef={c.videoRef}
          src={c.videoSrc}
          onLoadedMetadata={c.handleVideoLoadedMetadata}
          onTimeUpdate={c.handleTimeUpdate}
          onPause={() => c.setPreviewPlayingSegment(false)}
        />

        <VideoTrimControls
          durationSec={c.durationSec}
          startSec={c.startSec}
          endSec={c.endSec}
          onStartChange={c.handleStartTrimChange}
          onEndChange={c.handleEndTrimChange}
          onPreviewRange={c.handlePreviewSegment}
          onJumpIn={() => c.jumpToTime(c.startSec)}
          onJumpOut={() => c.jumpToTime(c.endSec)}
          onReset={c.resetTrim}
        />

        <VideoMetadataStrip probeState={c.probeState} durationSec={c.durationSec} />
      </div>

      <VideoExportInspector
        outputFormat={c.outputFormat}
        quality={c.quality}
        resolution={c.resolution}
        removeAudio={c.removeAudio}
        fastCopy={c.fastCopy}
        ffmpegReady={c.ffmpegReady}
        dispatchState={c.dispatchState}
        onFormatChange={c.setOutputFormat}
        onQualityChange={c.setQuality}
        onResolutionChange={c.setResolution}
        onRemoveAudioChange={c.setRemoveAudio}
        onFastCopyChange={c.setFastCopy}
        onDispatch={c.dispatchJob}
      />
    </div>
  );
}
