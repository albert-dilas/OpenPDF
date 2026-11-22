'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  extractErrorMessage,
  getWorkspaceAssetDownloadUrl,
  inspectVideoRequest,
  isAbortError,
  isOfflineError,
  JobRecord,
  processVideoJobRequest,
  SessionAssetRecord,
  VideoMetadataSummary,
  VideoOutputFormat,
  VideoQualityPreset,
  VideoResolutionPreset,
} from '@/lib/api';
import {
  AsyncResourceState,
  getResourceData,
  MutationState,
} from '@/lib/fsm';
import { selectAssets, useWorkspaceStore } from '@/store/useWorkspaceStore';
import { useJobsStore } from '@/store/useJobsStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  selectEngineCapabilities,
  selectHasCheckedEngine,
  useSystemStore,
} from '@/store/useSystemStore';
import { useI18n } from '@/i18n';

export const ACCEPTED_VIDEO_EXTS = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'];

export type VideoSource =
  | { kind: 'none' }
  | { kind: 'local'; file: File; objectUrl: string }
  | { kind: 'tray'; asset: SessionAssetRecord };

export function useVideoStudioController() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const probeAbortRef = useRef<AbortController | null>(null);

  const assets = useWorkspaceStore(selectAssets);
  const pendingChainedAsset = useWorkspaceStore((s) => s.pendingChainedAsset);
  const clearPendingChainedAsset = useWorkspaceStore((s) => s.clearPendingChainedAsset);
  const upsertJob = useJobsStore((s) => s.upsertJob);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const capabilities = useSystemStore(selectEngineCapabilities);
  const hasCheckedEngine = useSystemStore(selectHasCheckedEngine);

  const [source, setSource] = useState<VideoSource>({ kind: 'none' });
  const [probeState, setProbeState] = useState<AsyncResourceState<VideoMetadataSummary>>({
    status: 'idle',
  });
  const [dispatchState, setDispatchState] = useState<MutationState<JobRecord>>({
    status: 'idle',
  });

  const [durationSec, setDurationSec] = useState<number>(0);
  const [startSec, setStartSec] = useState<number>(0);
  const [endSec, setEndSec] = useState<number>(0);
  const [previewPlayingSegment, setPreviewPlayingSegment] = useState(false);

  const [outputFormat, setOutputFormat] = useState<VideoOutputFormat>('mp4');
  const [quality, setQuality] = useState<VideoQualityPreset>('medium');
  const [resolution, setResolution] = useState<VideoResolutionPreset>('original');
  const [removeAudio, setRemoveAudio] = useState<boolean>(false);
  const [fastCopy, setFastCopy] = useState<boolean>(false);

  const videoTrayAssets = useMemo(
    () => assets.filter((a) => a.domain === 'video'),
    [assets]
  );

  const revokeSourceUrl = useCallback((src: VideoSource) => {
    if (src.kind === 'local') {
      URL.revokeObjectURL(src.objectUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      probeAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      revokeSourceUrl(source);
    };
  }, [revokeSourceUrl, source]);

  const runProbe = useCallback(
    async (input: { file?: File; assetId?: string }, fallbackMeta?: VideoMetadataSummary) => {
      probeAbortRef.current?.abort();
      const controller = new AbortController();
      probeAbortRef.current = controller;

      setProbeState(
        fallbackMeta
          ? { status: 'revalidating', data: fallbackMeta }
          : { status: 'loading' }
      );

      try {
        const meta = await inspectVideoRequest({
          ...input,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setProbeState({ status: 'ready', data: meta });
        const probedDuration =
          typeof meta.duration_sec === 'number'
            ? meta.duration_sec
            : typeof meta.duration === 'number'
            ? meta.duration
            : 0;
        if (probedDuration > 0) {
          setDurationSec(probedDuration);
          setStartSec(0);
          setEndSec(Number(probedDuration.toFixed(2)));
        }
      } catch (err) {
        if (isAbortError(err)) return;
        const msg = await extractErrorMessage(err, 'ffprobe unavailable');
        setProbeState(
          isOfflineError(err)
            ? { status: 'offline', data: fallbackMeta, error: msg }
            : { status: 'error', data: fallbackMeta, error: msg }
        );
      } finally {
        if (probeAbortRef.current === controller) {
          probeAbortRef.current = null;
        }
      }
    },
    []
  );

  const loadLocalVideoFile = useCallback(
    (file: File) => {
      const lower = file.name.toLowerCase();
      if (!ACCEPTED_VIDEO_EXTS.some((ext) => lower.endsWith(ext))) {
        toast.error(`Format not supported: ${file.name}`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setSource({ kind: 'local', file, objectUrl });
      setDurationSec(0);
      setStartSec(0);
      setEndSec(0);
      setDispatchState({ status: 'idle' });
      runProbe({ file });
    },
    [runProbe]
  );

  const loadTrayVideoAsset = useCallback(
    (asset: SessionAssetRecord) => {
      const fallbackMeta = asset.metadata as VideoMetadataSummary;
      const existingDur =
        typeof asset.metadata?.duration_sec === 'number'
          ? asset.metadata.duration_sec
          : typeof asset.metadata?.duration === 'number'
          ? asset.metadata.duration
          : 0;

      setSource({ kind: 'tray', asset });
      setDurationSec(existingDur);
      setStartSec(0);
      setEndSec(existingDur > 0 ? Number(existingDur.toFixed(2)) : 0);
      setDispatchState({ status: 'idle' });
      runProbe({ assetId: asset.id }, fallbackMeta);
    },
    [runProbe]
  );

  useEffect(() => {
    if (!pendingChainedAsset) return;
    if (pendingChainedAsset.targetHref !== '/video-studio') return;
    const asset = pendingChainedAsset.asset;
    clearPendingChainedAsset();
    if (asset.domain === 'video') {
      loadTrayVideoAsset(asset);
    } else {
      toast.error(`Unsupported file domain for Video Studio: ${asset.filename}`);
    }
  }, [clearPendingChainedAsset, loadTrayVideoAsset, pendingChainedAsset]);

  const videoSrc = useMemo(() => {
    if (source.kind === 'local') return source.objectUrl;
    if (source.kind === 'tray') return getWorkspaceAssetDownloadUrl(source.asset.id, true);
    return null;
  }, [source]);

  const activeName =
    source.kind === 'local'
      ? source.file.name
      : source.kind === 'tray'
      ? source.asset.filename
      : '';
  const activeSize =
    source.kind === 'local'
      ? source.file.size
      : source.kind === 'tray'
      ? source.asset.size_bytes
      : 0;

  const handleVideoLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (Number.isFinite(vid.duration) && vid.duration > 0 && durationSec === 0) {
      const dur = Number(vid.duration.toFixed(2));
      setDurationSec(dur);
      setStartSec(0);
      setEndSec(dur);
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid || !previewPlayingSegment) return;
    if (endSec > startSec && vid.currentTime >= endSec) {
      vid.pause();
      setPreviewPlayingSegment(false);
    }
  };

  const handleStartTrimChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, Math.max(0, endSec - 0.2)));
    setStartSec(Number(clamped.toFixed(2)));
    if (videoRef.current) videoRef.current.currentTime = clamped;
  };

  const handleEndTrimChange = (val: number) => {
    const clamped = Math.min(durationSec, Math.max(val, startSec + 0.2));
    setEndSec(Number(clamped.toFixed(2)));
    if (videoRef.current) videoRef.current.currentTime = clamped;
  };

  const handlePreviewSegment = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = startSec;
    setPreviewPlayingSegment(true);
    vid.play().catch(() => {
      setPreviewPlayingSegment(false);
    });
  };

  const jumpToTime = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
    }
  };

  const resetTrim = () => {
    setStartSec(0);
    setEndSec(durationSec);
  };

  const resetSource = () => {
    probeAbortRef.current?.abort();
    setSource({ kind: 'none' });
    setProbeState({ status: 'idle' });
    setDispatchState({ status: 'idle' });
    setDurationSec(0);
    setStartSec(0);
    setEndSec(0);
  };

  const dispatchJob = async () => {
    if (source.kind === 'none') return;
    setDispatchState({ status: 'pending' });
    try {
      const isTrimmed =
        durationSec > 0 && (startSec > 0.05 || endSec < durationSec - 0.05);
      const job = await processVideoJobRequest({
        file: source.kind === 'local' ? source.file : undefined,
        asset_id: source.kind === 'tray' ? source.asset.id : undefined,
        start_sec: isTrimmed || startSec > 0 ? startSec : undefined,
        end_sec: isTrimmed ? endSec : undefined,
        output_format: outputFormat,
        quality,
        resolution,
        remove_audio: removeAudio,
        fast_copy: fastCopy && outputFormat !== 'gif' && outputFormat !== 'webm',
      });
      upsertJob(job);
      updateSetting('jobDrawerOpen', true);
      setDispatchState({ status: 'success', data: job });
      toast.success(t.videoStudio.jobDispatchedToast);
    } catch (err) {
      const msg = await extractErrorMessage(err, 'No se pudo enviar el trabajo de video.');
      setDispatchState(
        isOfflineError(err)
          ? { status: 'offline', error: msg }
          : { status: 'error', error: msg }
      );
      toast.error(msg);
    }
  };

  return {
    videoRef,
    videoSrc,
    activeName,
    activeSize,
    videoTrayAssets,
    probeState,
    metadata: getResourceData(probeState) ?? null,
    dispatchState,
    ffmpegReady: !hasCheckedEngine || capabilities.ffmpeg,
    durationSec,
    startSec,
    endSec,
    outputFormat,
    quality,
    resolution,
    removeAudio,
    fastCopy,
    setOutputFormat,
    setQuality,
    setResolution,
    setRemoveAudio,
    setFastCopy,
    setPreviewPlayingSegment,
    loadLocalVideoFile,
    loadTrayVideoAsset,
    handleVideoLoadedMetadata,
    handleTimeUpdate,
    handleStartTrimChange,
    handleEndTrimChange,
    handlePreviewSegment,
    jumpToTime,
    resetTrim,
    resetSource,
    dispatchJob,
  };
}
