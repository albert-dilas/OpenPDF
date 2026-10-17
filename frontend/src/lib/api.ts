import axios from 'axios';

// En producción estática servida por FastAPI usamos ruta relativa same-origin (/api/v1)
// para soportar cualquier puerto local (8000 o fallback) y evitar problemas de CORS.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:8000/api/v1'
    : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export interface SystemStatusResponse {
  version: string;
  capabilities: {
    ocr: boolean;
    word_to_pdf: boolean;
  };
  ocr_languages: string[];
  max_file_size_mb: number;
}

export interface SystemUpdateResponse {
  current: string;
  latest: string | null;
  update_available: boolean;
  online: boolean;
  url?: string | null;
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

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const extractFileNameFromDisposition = (
  disposition?: string | null,
  fallback = 'documento_openpdf.pdf'
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
      return 'No se puede conectar con el motor local de OpenPDF. Verifica que la aplicación esté activa.';
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
        // Blob no era JSON válido
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
