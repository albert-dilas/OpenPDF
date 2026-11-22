import axios from 'axios';

// In static production export served by FastAPI we use same-origin relative /api/v1
// to support any local port without CORS complications.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export type ModuleId =
  | 'ocr'
  | 'word_to_pdf'
  | 'ffmpeg'
  | 'yt_dlp'
  | 'rembg_onnx'
  | 'whisper_cpu';

export type BinaryModuleId = 'ocr' | 'word_to_pdf' | 'ffmpeg' | 'yt_dlp';
export type InstallableModuleId = ModuleId | 'ocr_lang_spa';

export interface ModuleStatusInfo {
  available: boolean;
  engine: string | null;
  binary_path: string | null;
  source: string;
  languages?: string[];
  has_spanish?: boolean;
  install_status: 'idle' | 'installing' | 'completed' | 'failed';
  install_message?: string | null;
}

export interface SystemCapabilities {
  ocr: boolean;
  word_to_pdf: boolean;
  ffmpeg: boolean;
  yt_dlp: boolean;
  rembg_onnx: boolean;
  whisper_cpu: boolean;
}

export interface SystemModulesInfo {
  ocr: ModuleStatusInfo;
  word_to_pdf: ModuleStatusInfo;
  ffmpeg?: ModuleStatusInfo;
  yt_dlp?: ModuleStatusInfo;
  rembg_onnx?: ModuleStatusInfo;
  whisper_cpu?: ModuleStatusInfo;
  winget_available: boolean;
}

export interface SystemMetricsInfo {
  cpu_count: number;
  cpu_percent: number;
  memory_used_percent: number;
  temp_files_count: number;
}

export type UpdateMode = 'notify' | 'auto' | 'manual';
export type SaveMode = 'ask' | 'fixed_folder';

export interface DesktopConfig {
  keep_in_background: boolean;
  start_with_windows: boolean;
  start_minimized: boolean;
  context_menu_enabled: boolean;
  update_mode: UpdateMode;
  save_mode: SaveMode;
  default_output_dir: string;
  clean_temp_on_exit: boolean;
  smart_zip_downloads: boolean;
}

export interface StorageSummary {
  free_bytes: number;
  used_bytes: number;
  total_bytes: number;
  temp_bytes: number;
  session_bytes: number;
  models_bytes: number;
  recipes_bytes: number;
  updates_bytes: number;
  low_space_warning: boolean;
  data_dir: string;
  default_output_dir: string;
}

export interface DiskQuotaCheckResult {
  ok: boolean;
  low_space_warning: boolean;
  critical_low: boolean;
  free_bytes: number;
  recommended_free_bytes: number;
  message: string;
}

export type SelfUpdateStepStatus =
  | 'idle'
  | 'downloading'
  | 'verifying'
  | 'ready_to_install'
  | 'installing'
  | 'cancelled'
  | 'error';

export interface SelfUpdateStatus {
  status: SelfUpdateStepStatus;
  target_version: string | null;
  asset_name: string | null;
  downloaded_bytes: number;
  total_bytes: number;
  percent: number;
  sha256_expected: string | null;
  sha256_actual: string | null;
  verified: boolean;
  file_path: string | null;
  install_kind: 'installer' | 'portable' | null;
  error: string | null;
}

export interface SaveFixedOutputResult {
  saved: boolean;
  saved_path: string;
  directory: string;
  filename: string;
  size_bytes: number;
  extracted_files?: string[];
  extracted_count?: number;
}

export interface SystemStatusResponse {
  version: string;
  capabilities: SystemCapabilities;
  ocr_languages: string[];
  max_file_size_mb: number;
  modules?: SystemModulesInfo;
  system?: SystemMetricsInfo;
  desktop?: DesktopConfig;
}

export interface SystemUpdateResponse {
  current: string;
  latest: string | null;
  update_available: boolean;
  online: boolean;
  url?: string | null;
  notes?: string | null;
  download_url?: string | null;
  installer_url?: string | null;
  portable_url?: string | null;
  checksums_url?: string | null;
  asset_name?: string | null;
  release_name?: string | null;
}

export interface FeedbackPayload {
  category: 'feature' | 'bug' | 'opinion' | 'general';
  title: string;
  description: string;
  email?: string;
  system_info?: Record<string, unknown>;
}

export interface PdfPageInfo {
  index: number;
  width: number;
  height: number;
  rotation: number;
  thumbnail: string | null;
}

export interface PdfMetadata {
  title?: string | null;
  author?: string | null;
  subject?: string | null;
  keywords?: string | null;
  creator?: string | null;
  producer?: string | null;
}

export interface PdfInfoResponse {
  page_count: number;
  encrypted: boolean;
  metadata: PdfMetadata;
  pages: PdfPageInfo[];
}

export interface QrVerifyUrlResponse {
  url: string;
  final_url: string;
  reachable: boolean;
  status_code: number | null;
  content_type: string | null;
  title: string | null;
  elapsed_ms: number;
  error: string | null;
}

export interface QrDetectedItem {
  page: number;
  data: string;
  is_url: boolean;
  online_check: QrVerifyUrlResponse | null;
}

export interface QrInspectResponse {
  page_count: number;
  qr_count: number;
  items: QrDetectedItem[];
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobRecord {
  id: string;
  tool_id: string;
  studio: string;
  title: string;
  status: JobStatus;
  progress: number;
  stage: string;
  detail: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  elapsed_ms: number | null;
  input_bytes: number | null;
  output_bytes: number | null;
  output_asset_id: string | null;
  output_filename: string | null;
  output_mime: string | null;
  error: string | null;
  can_cancel: boolean;
}

export type AssetDomain = 'pdf' | 'video' | 'audio' | 'image' | 'archive' | 'data' | 'other';

export interface SessionAssetRecord {
  id: string;
  filename: string;
  size_bytes: number;
  mime_type: string;
  domain: AssetDomain;
  sha256: string | null;
  metadata: Record<string, unknown>;
  suggested_tools: string[];
  created_at: string;
  source_job_id: string | null;
}

export interface VideoMetadataSummary {
  duration?: number | null;
  duration_sec?: number | null;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  video_codec?: string | null;
  audio_codec?: string | null;
  bitrate?: number | null;
  bitrate_kbps?: number | null;
  has_audio?: boolean;
  format_name?: string | null;
  size_bytes?: number | null;
  filename?: string | null;
  [key: string]: unknown;
}

export type VideoOutputFormat = 'mp4' | 'webm' | 'mkv' | 'gif';
export type VideoQualityPreset = 'high' | 'medium' | 'compact';
export type VideoResolutionPreset = 'original' | '1080' | '720' | '480';

export interface VideoProcessJobParams {
  file?: File;
  asset_id?: string;
  start_sec?: number;
  end_sec?: number;
  output_format: VideoOutputFormat;
  quality: VideoQualityPreset;
  resolution: VideoResolutionPreset;
  remove_audio: boolean;
  fast_copy: boolean;
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatDuration = (seconds: number | null | undefined): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const extractFileNameFromDisposition = (
  disposition?: string | null,
  fallback = 'documento_tornio.pdf'
): string => {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''));
    } catch {
      // ignore decode error and fallback to standard filename match
    }
  }
  const asciiMatch = disposition.match(/filename=([^;\n]+)/i);
  if (asciiMatch?.[1]) {
    const cleaned = asciiMatch[1].trim().replace(/^["']|["']$/g, '');
    if (cleaned) return cleaned;
  }
  return fallback;
};

export async function extractErrorMessage(
  err: unknown,
  fallback = 'Error desconocido al procesar el archivo.'
): Promise<string> {
  if (axios.isCancel(err)) {
    return 'Operación cancelada por el usuario.';
  }

  if (axios.isAxiosError(err)) {
    if (err.code === 'ERR_CANCELED') {
      return 'Operación cancelada por el usuario.';
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return 'Tiempo de espera agotado al procesar el documento.';
    }
    if (!err.response || err.code === 'ERR_NETWORK') {
      return 'No se puede conectar con el motor local de Tornio (127.0.0.1).';
    }

    const data = err.response.data;
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const json = JSON.parse(text);
        if (typeof json?.detail === 'string') return json.detail;
        if (Array.isArray(json?.detail) && json.detail[0]?.msg) {
          return String(json.detail[0].msg);
        }
        if (typeof json?.message === 'string') return json.message;
      } catch {
        // Blob was not JSON
      }
    } else if (data && typeof data === 'object') {
      const detail = (data as Record<string, unknown>).detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail[0]?.msg) {
        return String(detail[0].msg);
      }
      const message = (data as Record<string, unknown>).message;
      if (typeof message === 'string') return message;
    }

    if (err.response.status === 413) {
      return 'El archivo supera el tamaño máximo permitido.';
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}

// ==========================================
// Phase 1 / 1.5 Endpoint Helpers
// ==========================================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
}

export function isAbortError(err: unknown): boolean {
  if (axios.isCancel(err)) return true;
  if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') return true;
  if (err instanceof Error && err.name === 'AbortError') return true;
  return false;
}

export function isOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (axios.isAxiosError(err) && (!err.response || err.code === 'ERR_NETWORK')) return true;
  return false;
}

export async function fetchJobs(params?: {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<PaginatedResult<JobRecord>> {
  const query: Record<string, string | number> = {};
  if (typeof params?.limit === 'number') query.limit = params.limit;
  if (typeof params?.offset === 'number') query.offset = params.offset;

  const { data } = await apiClient.get<{
    jobs: JobRecord[];
    total?: number;
    has_more?: boolean;
    next_offset?: number | null;
  }>('/jobs/', {
    params: query,
    timeout: 6000,
    signal: params?.signal,
  });

  const items = Array.isArray(data?.jobs) ? data.jobs : [];
  const total = typeof data?.total === 'number' ? data.total : items.length;
  const hasMore = Boolean(data?.has_more);
  const nextOffset = typeof data?.next_offset === 'number' ? data.next_offset : null;
  return { items, total, hasMore, nextOffset };
}

export async function cancelJobRequest(jobId: string): Promise<JobRecord> {
  const { data } = await apiClient.post<{ job: JobRecord }>(`/jobs/${jobId}/cancel`, {}, { timeout: 8000 });
  return data.job;
}

export async function deleteJobRequest(jobId: string): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}`, { timeout: 6000 });
}

export function getJobDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/jobs/${jobId}/download`;
}

export async function inspectWorkspaceFile(
  file: File,
  signal?: AbortSignal
): Promise<SessionAssetRecord> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ asset: SessionAssetRecord }>('/workspace/inspect', form, {
    timeout: 60000,
    signal,
  });
  return data.asset;
}

export async function fetchWorkspaceAssets(params?: {
  limit?: number;
  offset?: number;
  domain?: AssetDomain | 'all';
  signal?: AbortSignal;
}): Promise<PaginatedResult<SessionAssetRecord>> {
  const query: Record<string, string | number> = {};
  if (typeof params?.limit === 'number') query.limit = params.limit;
  if (typeof params?.offset === 'number') query.offset = params.offset;
  if (params?.domain && params.domain !== 'all') query.domain = params.domain;

  const { data } = await apiClient.get<{
    assets: SessionAssetRecord[];
    total?: number;
    has_more?: boolean;
    next_offset?: number | null;
  }>('/workspace/assets', {
    params: query,
    timeout: 6000,
    signal: params?.signal,
  });

  const items = Array.isArray(data?.assets) ? data.assets : [];
  const total = typeof data?.total === 'number' ? data.total : items.length;
  const hasMore = Boolean(data?.has_more);
  const nextOffset = typeof data?.next_offset === 'number' ? data.next_offset : null;
  return { items, total, hasMore, nextOffset };
}

export function getWorkspaceAssetDownloadUrl(assetId: string, inline = false): string {
  const base = `${API_BASE_URL}/workspace/assets/${assetId}/download`;
  return inline ? `${base}?inline=true` : base;
}

export async function deleteWorkspaceAsset(assetId: string): Promise<void> {
  await apiClient.delete(`/workspace/assets/${assetId}`, { timeout: 6000 });
}

export async function clearWorkspaceAssets(): Promise<void> {
  await apiClient.delete('/workspace/assets', { timeout: 6000 });
}

export async function inspectVideoRequest(input: {
  file?: File;
  assetId?: string;
  signal?: AbortSignal;
}): Promise<VideoMetadataSummary> {
  const form = new FormData();
  if (input.file) form.append('file', input.file);
  if (input.assetId) form.append('asset_id', input.assetId);
  const { data } = await apiClient.post<
    VideoMetadataSummary & { metadata?: VideoMetadataSummary }
  >('/video/inspect', form, {
    timeout: 30000,
    signal: input.signal,
  });
  if (data && typeof data === 'object' && data.metadata && typeof data.metadata === 'object') {
    return { ...data, ...data.metadata };
  }
  return data;
}

export async function processVideoJobRequest(params: VideoProcessJobParams): Promise<JobRecord> {
  const form = new FormData();
  if (params.file) form.append('file', params.file);
  if (params.asset_id) form.append('asset_id', params.asset_id);
  if (typeof params.start_sec === 'number') form.append('start_sec', String(params.start_sec));
  if (typeof params.end_sec === 'number') form.append('end_sec', String(params.end_sec));
  form.append('output_format', params.output_format);
  form.append('quality', params.quality);
  form.append('resolution', params.resolution);
  form.append('remove_audio', String(params.remove_audio));
  form.append('fast_copy', String(params.fast_copy));

  const { data } = await apiClient.post<{ job: JobRecord }>('/video/process-job', form, {
    timeout: 60000,
  });
  return data.job;
}

// ==========================================
// Desktop Config, Storage, Quota, Updater & Cancel APIs
// ==========================================

export async function fetchDesktopConfig(signal?: AbortSignal): Promise<DesktopConfig> {
  const { data } = await apiClient.get<DesktopConfig>('/system/desktop-config', {
    timeout: 4500,
    signal,
  });
  return data;
}

export async function updateDesktopConfig(
  patch: Partial<DesktopConfig>
): Promise<DesktopConfig> {
  const { data } = await apiClient.put<DesktopConfig>('/system/desktop-config', patch, {
    timeout: 6000,
  });
  return data;
}

export async function fetchStorageSummary(signal?: AbortSignal): Promise<StorageSummary> {
  const { data } = await apiClient.get<StorageSummary>('/system/storage', {
    timeout: 6000,
    signal,
  });
  return data;
}

export async function checkDiskQuota(requiredBytes: number): Promise<DiskQuotaCheckResult> {
  const { data } = await apiClient.post<DiskQuotaCheckResult>(
    '/system/storage/check-quota',
    { required_bytes: Math.max(0, Math.round(requiredBytes)) },
    { timeout: 1500 }
  );
  return data;
}

export async function purgeTempStorage(includeSession = false): Promise<{
  purged: boolean;
  freed_bytes: number;
  storage: StorageSummary;
}> {
  const { data } = await apiClient.post<{
    purged: boolean;
    freed_bytes: number;
    storage: StorageSummary;
  }>(
    '/system/storage/purge-temp',
    { include_session: includeSession },
    { timeout: 10000 }
  );
  return data;
}

export async function openLocalFolder(target: 'data' | 'output'): Promise<{
  opened: boolean;
  target: string;
  path: string;
}> {
  const { data } = await apiClient.post<{
    opened: boolean;
    target: string;
    path: string;
  }>('/system/storage/open-folder', { target }, { timeout: 5000 });
  return data;
}

export async function saveOutputToFixedFolder(
  blob: Blob,
  filename: string
): Promise<SaveFixedOutputResult> {
  const form = new FormData();
  const safeFile = new File([blob], filename, {
    type: blob.type || 'application/octet-stream',
  });
  form.append('file', safeFile);
  form.append('filename', filename);
  const { data } = await apiClient.post<SaveFixedOutputResult>(
    '/system/storage/save-output',
    form,
    { timeout: 60000 }
  );
  return data;
}

export async function fetchSelfUpdateStatus(signal?: AbortSignal): Promise<SelfUpdateStatus> {
  const { data } = await apiClient.get<SelfUpdateStatus>('/system/update-status', {
    timeout: 3000,
    signal,
  });
  return data;
}

export async function startSelfUpdateDownload(payload: {
  download_url: string;
  target_version: string;
  asset_name?: string | null;
  checksums_url?: string | null;
  expected_sha256?: string | null;
}): Promise<SelfUpdateStatus> {
  const { data } = await apiClient.post<SelfUpdateStatus>('/system/update-download', payload, {
    timeout: 8000,
  });
  return data;
}

export async function cancelSelfUpdateDownload(): Promise<SelfUpdateStatus> {
  const { data } = await apiClient.post<SelfUpdateStatus>(
    '/system/update-cancel',
    {},
    { timeout: 5000 }
  );
  return data;
}

export async function applySelfUpdate(): Promise<{
  applied: boolean;
  dry_run?: boolean;
  install_kind?: string;
  target_version?: string;
}> {
  const { data } = await apiClient.post<{
    applied: boolean;
    dry_run?: boolean;
    install_kind?: string;
    target_version?: string;
  }>('/system/update-apply', {}, { timeout: 10000 });
  return data;
}

export async function cancelActiveRequest(requestId: string): Promise<void> {
  if (!requestId) return;
  await apiClient.post(`/system/cancel-request/${encodeURIComponent(requestId)}`, {}, { timeout: 2500 });
}
