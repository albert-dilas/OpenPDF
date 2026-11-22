'use client';

import React, { useMemo } from 'react';
import ToolPage, { ExtraField } from '@/components/pdf/ToolPage';
import { getToolById } from '@/config/studios';
import { useI18n } from '@/i18n';

interface ToolRuntimeConfig {
  outputExtension: string;
  multiple?: boolean;
  useMultipleFilesField?: boolean;
  showImageIcon?: boolean;
  allowWithoutFile?: boolean;
  extraFields?: ExtraField[];
}

function resolveToolRuntimeConfig(toolId: string): ToolRuntimeConfig {
  switch (toolId) {
    // 1. Documents Extras
    case 'pdf-diff':
      return {
        outputExtension: '.pdf',
        multiple: true,
        useMultipleFilesField: true,
      };
    case 'pdf-tables-csv':
      return {
        outputExtension: '.csv',
      };
    case 'pdf-repair':
      return {
        outputExtension: '.pdf',
      };

    // 2. Video Studio Tools
    case 'video-to-gif':
      return {
        outputExtension: '.gif',
        extraFields: [
          {
            key: 'fps',
            label: 'Cuadros por segundo (FPS)',
            type: 'select',
            defaultValue: '12',
            options: [
              { value: '10', label: '10 FPS (Ligero)' },
              { value: '12', label: '12 FPS (Equilibrado)' },
              { value: '15', label: '15 FPS (Fluido)' },
            ],
          },
          {
            key: 'width',
            label: 'Ancho en píxeles',
            type: 'select',
            defaultValue: '480',
            options: [
              { value: '360', label: '360 px (Compacto)' },
              { value: '480', label: '480 px (Estándar)' },
              { value: '640', label: '640 px (Alta nitidez)' },
            ],
          },
        ],
      };
    case 'video-extract-audio':
      return {
        outputExtension: '.mp3',
        extraFields: [
          {
            key: 'target_format',
            label: 'Formato de audio',
            type: 'select',
            defaultValue: 'mp3',
            options: [
              { value: 'mp3', label: 'MP3 (Universal)' },
              { value: 'wav', label: 'WAV (Sin pérdida PCM)' },
              { value: 'flac', label: 'FLAC (Compresión sin pérdida)' },
            ],
          },
        ],
      };
    case 'video-compress':
      return {
        outputExtension: '.mp4',
        extraFields: [
          {
            key: 'quality_level',
            label: 'Nivel de reducción de peso',
            type: 'select',
            defaultValue: 'medium',
            options: [
              { value: 'low', label: 'Fidelidad Alta (Reducción moderada)' },
              { value: 'medium', label: 'Equilibrado (Recomendado)' },
              { value: 'high', label: 'Máxima Compresión (Menor peso)' },
            ],
          },
        ],
      };
    case 'video-thumbnails':
      return {
        outputExtension: '.jpg',
      };
    case 'video-burn-subtitles':
      return {
        outputExtension: '.mp4',
        extraFields: [
          {
            key: 'subtitle_text',
            label: 'Texto o cintillo a incrustar',
            type: 'text',
            placeholder: 'Ej. Presentación Oficial · Tornio',
            defaultValue: 'Tornio Video Studio',
          },
        ],
      };
    case 'video-merge':
      return {
        outputExtension: '.mp4',
        multiple: true,
        useMultipleFilesField: true,
      };
    case 'video-speed':
      return {
        outputExtension: '.mp4',
        extraFields: [
          {
            key: 'factor',
            label: 'Multiplicador de velocidad',
            type: 'select',
            defaultValue: '1.5',
            options: [
              { value: '0.5', label: '0.5x (Cámara lenta)' },
              { value: '1.25', label: '1.25x (Ágil)' },
              { value: '1.5', label: '1.5x (Rápido)' },
              { value: '2.0', label: '2.0x (Timelapse)' },
            ],
          },
        ],
      };

    // 3. Audio Studio Tools
    case 'audio-convert':
      return {
        outputExtension: '.mp3',
        extraFields: [
          {
            key: 'target_format',
            label: 'Formato de salida',
            type: 'select',
            defaultValue: 'mp3',
            options: [
              { value: 'mp3', label: 'MP3' },
              { value: 'wav', label: 'WAV (Sin pérdida)' },
              { value: 'flac', label: 'FLAC' },
              { value: 'ogg', label: 'OGG Vorbis' },
            ],
          },
          {
            key: 'bitrate',
            label: 'Calidad (Bitrate)',
            type: 'select',
            defaultValue: '192k',
            options: [
              { value: '128k', label: '128 kbps (Voz / Ligero)' },
              { value: '192k', label: '192 kbps (Estándar)' },
              { value: '320k', label: '320 kbps (Máxima calidad)' },
            ],
          },
        ],
      };
    case 'audio-trim':
      return {
        outputExtension: '.mp3',
        extraFields: [
          {
            key: 'start_sec',
            label: 'Segundo de inicio (IN)',
            type: 'text',
            defaultValue: '0',
            placeholder: '0',
          },
          {
            key: 'end_sec',
            label: 'Segundo de fin (OUT)',
            type: 'text',
            defaultValue: '30',
            placeholder: '30',
          },
        ],
      };
    case 'audio-normalize':
      return {
        outputExtension: '.mp3',
        extraFields: [
          {
            key: 'target_lufs',
            label: 'Objetivo de sonoridad (EBU R128)',
            type: 'select',
            defaultValue: '-14',
            options: [
              { value: '-14', label: '-14 LUFS (Streaming / YouTube / Spotify)' },
              { value: '-16', label: '-16 LUFS (Podcasts / Locución y Clases)' },
            ],
          },
        ],
      };
    case 'audio-denoise':
      return {
        outputExtension: '.mp3',
      };
    case 'audio-merge':
      return {
        outputExtension: '.mp3',
        multiple: true,
        useMultipleFilesField: true,
      };
    case 'audio-metadata':
      return {
        outputExtension: '.mp3',
        extraFields: [
          {
            key: 'title',
            label: 'Título de la pista (dejar vacío para limpiar)',
            type: 'text',
            placeholder: 'Título',
          },
          {
            key: 'artist',
            label: 'Autor / Artista',
            type: 'text',
            placeholder: 'Artista',
          },
          {
            key: 'album',
            label: 'Álbum / Proyecto',
            type: 'text',
            placeholder: 'Álbum',
          },
        ],
      };

    // 4. Images & Visual AI Studio
    case 'image-convert':
      return {
        outputExtension: '.webp',
        showImageIcon: true,
        extraFields: [
          {
            key: 'target_format',
            label: 'Formato de destino',
            type: 'select',
            defaultValue: 'webp',
            options: [
              { value: 'webp', label: 'WebP (Alta eficiencia)' },
              { value: 'avif', label: 'AVIF (Nueva generación)' },
              { value: 'png', label: 'PNG (Sin pérdida)' },
              { value: 'jpg', label: 'JPG (Fotografía compatible)' },
            ],
          },
          {
            key: 'enhance_mode',
            label: 'Mejora Inteligente de Nitidez',
            type: 'select',
            defaultValue: 'none',
            options: [
              { value: 'none', label: 'Original (Sin filtro)' },
              {
                value: 'document_scan',
                label: 'Mejorar Escaneo / Foto de Apuntes (Súper Nitidez)',
              },
              { value: 'vivid', label: 'Realzar Contraste y Detalle Visual' },
            ],
          },
        ],
      };
    case 'image-compress':
      return {
        outputExtension: '.webp',
        showImageIcon: true,
        extraFields: [
          {
            key: 'quality_level',
            label: 'Nivel de optimización',
            type: 'select',
            defaultValue: 'medium',
            options: [
              { value: 'low', label: 'Alta fidelidad (85%)' },
              { value: 'medium', label: 'Equilibrado (72%)' },
              { value: 'high', label: 'Máximo ahorro de peso (56%)' },
            ],
          },
        ],
      };
    case 'image-resize-crop':
      return {
        outputExtension: '.png',
        showImageIcon: true,
        extraFields: [
          {
            key: 'width',
            label: 'Ancho objetivo (px)',
            type: 'text',
            defaultValue: '1280',
          },
          {
            key: 'height',
            label: 'Alto objetivo (px)',
            type: 'text',
            defaultValue: '720',
          },
          {
            key: 'mode',
            label: 'Modo de ajuste',
            type: 'select',
            defaultValue: 'fit',
            options: [
              { value: 'fit', label: 'Proporcional (Sin recortar)' },
              { value: 'crop', label: 'Recorte centrado exacto (Cover)' },
              { value: 'stretch', label: 'Forzar dimensiones exactas' },
            ],
          },
        ],
      };
    case 'image-exif-strip':
      return {
        outputExtension: '.jpg',
        showImageIcon: true,
      };
    case 'image-bg-remove':
      return {
        outputExtension: '.png',
        showImageIcon: true,
      };
    case 'image-ico-favicon':
      return {
        outputExtension: '.ico',
        showImageIcon: true,
      };
    case 'image-palette':
      return {
        outputExtension: '.png',
        showImageIcon: true,
      };

    // 5. Files, Security & Dev Lab
    case 'archive-pack':
      return {
        outputExtension: '.zip',
        multiple: true,
        useMultipleFilesField: true,
        extraFields: [
          {
            key: 'mode',
            label: 'Operación',
            type: 'select',
            defaultValue: 'zip',
            options: [
              { value: 'zip', label: 'Empaquetar archivos en .ZIP' },
              { value: 'targz', label: 'Empaquetar archivos en .TAR.GZ' },
              {
                value: 'inspect',
                label: 'Auditar árbol interno y seguridad Anti-ZipSlip (.MD)',
              },
            ],
          },
        ],
      };
    case 'file-hash-verify':
      return {
        outputExtension: '.md',
        extraFields: [
          {
            key: 'expected_hash',
            label: 'Hash esperado para comparar (opcional)',
            type: 'text',
            placeholder: 'Pega aquí un hash SHA-256, SHA-512 o MD5...',
          },
        ],
      };
    case 'file-vault':
      return {
        outputExtension: '.tvault',
        extraFields: [
          {
            key: 'mode',
            label: 'Acción criptográfica',
            type: 'select',
            defaultValue: 'encrypt',
            options: [
              { value: 'encrypt', label: 'Cifrar archivo (AES-256-GCM + Scrypt)' },
              { value: 'decrypt', label: 'Descifrar contenedor .tvault' },
            ],
          },
          {
            key: 'password',
            label: 'Contraseña maestra',
            type: 'password',
            placeholder: 'Mínimo 4 caracteres',
            required: true,
            requiredMessage: 'Ingresa la contraseña maestra para cifrar o descifrar.',
          },
        ],
      };
    case 'data-transform':
      return {
        outputExtension: '.json',
        extraFields: [
          {
            key: 'target_format',
            label: 'Convertir estructura a',
            type: 'select',
            defaultValue: 'json',
            options: [
              { value: 'json', label: 'JSON formateado' },
              { value: 'yaml', label: 'YAML limpio' },
              { value: 'csv', label: 'Hoja CSV (Excel)' },
              { value: 'markdown', label: 'Tabla Markdown (.MD)' },
            ],
          },
        ],
      };
    case 'regex-diff-lab':
      return {
        outputExtension: '.md',
        multiple: true,
        useMultipleFilesField: true,
        extraFields: [
          {
            key: 'regex_pattern',
            label: 'Expresión Regular (si subes 1 archivo)',
            type: 'text',
            defaultValue: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+',
            placeholder: 'Patrón Regex...',
          },
          {
            key: 'replacement',
            label: 'Texto de reemplazo (opcional)',
            type: 'text',
            placeholder: 'Ej. [CONFIDENCIAL]',
          },
        ],
      };
    case 'qr-barcode-batch':
      return {
        outputExtension: '.zip',
        allowWithoutFile: true,
        extraFields: [
          {
            key: 'raw_items',
            label: 'Lista de enlaces o códigos (uno por línea)',
            type: 'textarea',
            defaultValue: 'https://albert-dilas.github.io/OpenPDF/\nINVENTARIO-2026-001',
            placeholder: 'Escribe una URL o código por línea...',
          },
        ],
      };

    // 6. Local AI Studio
    case 'ai-transcribe':
      return {
        outputExtension: '.srt',
        extraFields: [
          {
            key: 'target_format',
            label: 'Formato de transcripción',
            type: 'select',
            defaultValue: 'srt',
            options: [
              { value: 'srt', label: 'Subtítulos con marcas de tiempo (.SRT)' },
              { value: 'txt', label: 'Texto continuo limpio (.TXT)' },
            ],
          },
          {
            key: 'language',
            label: 'Idioma del audio',
            type: 'select',
            defaultValue: 'es',
            options: [
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'Inglés' },
            ],
          },
        ],
      };
    case 'ai-tts-local':
      return {
        outputExtension: '.wav',
        allowWithoutFile: true,
        extraFields: [
          {
            key: 'custom_text',
            label: 'Texto a convertir en voz (o sube un archivo TXT/MD/PDF)',
            type: 'textarea',
            defaultValue:
              'Bienvenido a Tornio. Procesamiento local de documentos y multimedia con privacidad total.',
            placeholder: 'Escribe o pega el texto que deseas escuchar en audio WAV...',
          },
        ],
      };
    case 'ai-doc-summary':
      return {
        outputExtension: '.md',
      };
    case 'ai-doc-chunks':
      return {
        outputExtension: '.json',
        extraFields: [
          {
            key: 'chunk_size',
            label: 'Tamaño de cada bloque (caracteres)',
            type: 'select',
            defaultValue: '800',
            options: [
              { value: '400', label: '400 caracteres (~100 tokens)' },
              { value: '800', label: '800 caracteres (~200 tokens)' },
              { value: '1600', label: '1600 caracteres (~400 tokens)' },
            ],
          },
          {
            key: 'overlap',
            label: 'Solapamiento entre bloques',
            type: 'select',
            defaultValue: '120',
            options: [
              { value: '0', label: 'Sin solapamiento (0)' },
              { value: '120', label: '120 caracteres (Recomendado)' },
              { value: '240', label: '240 caracteres (Contexto denso)' },
            ],
          },
        ],
      };

    // 7. Web & Online Capture
    case 'yt-dlp-capture':
      return {
        outputExtension: '.mp4',
        allowWithoutFile: true,
        extraFields: [
          {
            key: 'url',
            label: 'URL pública del recurso multimedia',
            type: 'text',
            placeholder: 'https://...',
            required: true,
            requiredMessage: 'Ingresa una URL pública válida.',
          },
          {
            key: 'target_format',
            label: 'Modo de captura',
            type: 'select',
            defaultValue: 'mp4',
            options: [
              { value: 'mp4', label: 'Video completo (.MP4)' },
              { value: 'mp3', label: 'Solo pista de audio (.MP3)' },
            ],
          },
        ],
      };
    case 'web-markdown-clip':
      return {
        outputExtension: '.md',
        allowWithoutFile: true,
        extraFields: [
          {
            key: 'url',
            label: 'URL pública del artículo o documentación',
            type: 'text',
            placeholder: 'https://...',
            required: true,
            requiredMessage: 'Ingresa la URL pública que deseas extraer a Markdown.',
          },
        ],
      };
    case 'web-headers-ssl':
      return {
        outputExtension: '.md',
        allowWithoutFile: true,
        extraFields: [
          {
            key: 'url',
            label: 'URL pública a auditar (Anti-SSRF activo)',
            type: 'text',
            placeholder: 'https://...',
            required: true,
            requiredMessage: 'Ingresa la URL pública cuyas cabeceras deseas auditar.',
          },
        ],
      };

    default:
      return {
        outputExtension: '.bin',
      };
  }
}

export default function UniversalStudioToolView({ toolId }: { toolId: string }) {
  const { t } = useI18n();
  const tool = useMemo(() => getToolById(toolId), [toolId]);
  const runtime = useMemo(() => resolveToolRuntimeConfig(toolId), [toolId]);

  const copy = t.tools[toolId] ?? {
    name: toolId,
    description: '',
  };

  const acceptStr = tool?.accepts?.length ? tool.accepts.join(',') : '*';

  return (
    <ToolPage
      title={copy.name}
      description={copy.description}
      endpoint={`/tools/${toolId}`}
      buttonLabel={`Ejecutar ${copy.name}`}
      accept={acceptStr}
      multiple={runtime.multiple}
      useMultipleFilesField={runtime.useMultipleFilesField}
      outputExtension={runtime.outputExtension}
      showImageIcon={runtime.showImageIcon}
      allowWithoutFile={runtime.allowWithoutFile}
      extraFields={runtime.extraFields}
      capabilityRequired={tool?.requiredCapability}
    />
  );
}
