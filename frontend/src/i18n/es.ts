import type { ModuleRequirement, StudioId } from '@/config/studios';
import type { JobStatus } from '@/lib/api';

export interface StudioCopy {
  name: string;
  tagline: string;
  description: string;
}

export interface ToolCopy {
  name: string;
  description: string;
}

export interface ModuleCopy {
  title: string;
  shortTitle: string;
  subtitle: string;
  installDesc: string;
  placeholderPath: string;
}

export interface TranslationDictionary {
  brand: {
    name: string;
    subtitle: string;
    localBadge: string;
    engineChipOnline: string;
    engineChipOffline: string;
    engineChipChecking: string;
  };
  common: {
    active: string;
    phase2: string;
    online: string;
    offline: string;
    all: string;
    close: string;
    cancel: string;
    save: string;
    download: string;
    delete: string;
    clear: string;
    retry: string;
    ready: string;
    pending: string;
    installing: string;
    connected: string;
    disconnected: string;
    backHome: string;
    openSettings: string;
    openTray: string;
    sendToTray: string;
    pinShortcut: string;
    unpinShortcut: string;
    copy: string;
    copied: string;
    loading: string;
    files: string;
    bytes: string;
    newBadge: string;
    noResults: string;
    loadMore: string;
    loadingMore: string;
    revalidating: string;
    abort: string;
    aborted: string;
    confirmTitle: string;
    allStudiosReset: string;
  };
  nav: {
    home: string;
    workspace: string;
    pipelines: string;
    roadmap: string;
    settings: string;
    suggestFeedback: string;
    studiosSection: string;
    pinnedSection: string;
    enginesLabel: string;
    collapseSidebar: string;
    expandSidebar: string;
    searchTrigger: string;
    jobQueue: string;
    languageToggle: string;
    skinToggle: string;
    skins: {
      porcelain: string;
      carbon: string;
      swiss: string;
      system: string;
    };
  };
  studios: Record<StudioId, StudioCopy>;
  categories: Record<string, string>;
  tools: Record<string, ToolCopy>;
  home: {
    greeting: string;
    greetingFallback: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    heroTitle: string;
    heroSubtitle: string;
    orbStatusIdle: string;
    orbStatusRunning: string;
    orbStatusOffline: string;
    quickLaunchTitle: string;
    quickLaunchSubtitle: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    dropzoneButton: string;
    dropzoneInspecting: string;
    dropzoneFormatsHint: string;
    inspectedAssetTitle: string;
    suggestedActions: string;
    viewAllTray: string;
    pinnedTitle: string;
    pinnedSubtitle: string;
    browseDocuments: string;
    managePins: string;
    studioToolsSection: string;
    studioUpcomingNotice: string;
    openVideoWorkbench: string;
    videoWorkbenchHint: string;
    catalogTitle: string;
    catalogSubtitle: string;
    searchPlaceholder: string;
    clearFilters: string;
    toolsCountSuffix: string;
    phase2ModalTitle: string;
    phase2ModalBody: string;
    phase2ModalTarget: string;
    phase2ModalOpenRoadmap: string;
    phase2ModalOpenModules: string;
    telemetryCpu: string;
    telemetryRam: string;
    telemetryTemp: string;
    activeLabel: string;
    profilesLabel: string;
    profiles: {
      all: string;
      office: string;
      student: string;
      creator: string;
      developer: string;
    };
    orbPopover: {
      title: string;
      statusOnline: string;
      statusRunning: string;
      statusOffline: string;
      dropHint: string;
      enginesLabel: string;
      cpuLabel: string;
      ramLabel: string;
      diskFreeLabel: string;
      viewJobs: string;
      purgeTemp: string;
      configureEngines: string;
      desktopSettings: string;
    };
    studioEvolutionNotice: string;
    proposeToolBtn: string;
    viewRoadmapLink: string;
  };
  quickFeedback: {
    title: string;
    subtitle: string;
    types: {
      feature: { title: string; desc: string };
      bug: { title: string; desc: string };
      opinion: { title: string; desc: string };
    };
    subjectLabel: string;
    subjectPlaceholder: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    saveLocalBtn: string;
    savingBtn: string;
    publishGithubBtn: string;
    githubHint: string;
    savedToast: string;
  };
  workspace: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    clearAll: string;
    confirmClearAll: string;
    filterAll: string;
    domains: Record<string, string>;
    metadataTitle: string;
    sha256Label: string;
    suggestedToolsLabel: string;
    openInToolLabel: string;
    downloadAsset: string;
    deleteAsset: string;
    uploadMore: string;
    noSuggestedActive: string;
    openVideoStudio: string;
  };
  videoStudio: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    pickFromTray: string;
    uploadVideoBtn: string;
    engineMissingTitle: string;
    engineMissingDesc: string;
    metadataTitle: string;
    duration: string;
    resolution: string;
    fps: string;
    videoCodec: string;
    audioCodec: string;
    bitrate: string;
    noAudioTrack: string;
    trimSection: string;
    trimIn: string;
    trimOut: string;
    trimDuration: string;
    jumpIn: string;
    jumpOut: string;
    previewRange: string;
    resetTrim: string;
    inspectorTitle: string;
    outputFormat: string;
    qualityLabel: string;
    qualities: {
      high: string;
      medium: string;
      compact: string;
    };
    resolutionLabel: string;
    resolutions: {
      original: string;
      '1080': string;
      '720': string;
      '480': string;
    };
    removeAudio: string;
    removeAudioHint: string;
    fastCopy: string;
    fastCopyHint: string;
    dispatchBtn: string;
    dispatchingBtn: string;
    jobDispatchedToast: string;
    changeVideo: string;
    inspectingMeta: string;
    activeJobsForVideo: string;
  };
  jobs: {
    drawerTitle: string;
    sseLive: string;
    sseOffline: string;
    ssePaused: string;
    pauseStream: string;
    resumeStream: string;
    emptyTitle: string;
    emptySubtitle: string;
    statuses: Record<JobStatus, string>;
    cancelJob: string;
    downloadResult: string;
    chainToTray: string;
    chainToVideo: string;
    removeJob: string;
    elapsed: string;
    outputSize: string;
  };
  modulesModal: {
    title: string;
    subtitle: string;
    rescanSystem: string;
    rescanDone: string;
    rescanError: string;
    doneBtn: string;
    statusReady: string;
    statusInstalling: string;
    statusPending: string;
    installComplete: string;
    installNotice: string;
    installingBanner: string;
    activeEngine: string;
    linkedPath: string;
    detectedLangs: string;
    installSpanishBtn: string;
    changeBinaryManual: string;
    resetAutoDetect: string;
    optionATitle: string;
    optionABadge: string;
    optionAButton: string;
    optionBTitle: string;
    optionBDesc: string;
    optionBButton: string;
    optionCTitle: string;
    optionCDesc: string;
    optionCButton: string;
    manualPathLabel: string;
    manualPathLink: string;
    installStartedToast: string;
    installErrorToast: string;
    binaryLinkedToast: string;
    binaryClearedToast: string;
    wingetUnavailable: string;
    items: Record<ModuleRequirement, ModuleCopy>;
  };
  commandPalette: {
    ariaLabel: string;
    placeholder: string;
    clearInput: string;
    noResults: string;
    toolsGroup: string;
    actionsGroup: string;
    footerHint: string;
    actions: {
      modules: { label: string; description: string };
      workspace: { label: string; description: string };
      videoStudio: { label: string; description: string };
      jobDrawer: { label: string; description: string };
      toggleLocale: { label: string; description: string };
      cycleSkin: { label: string; description: string };
      immersiveOn: { label: string; description: string };
      immersiveOff: { label: string; description: string };
      settings: { label: string; description: string };
    };
  };
  settings: {
    title: string;
    subtitle: string;
    checkUpdatesBtn: string;
    resetDefaults: string;
    resetConfirm: string;
    resetSuccess: string;
    savedLocallyNote: string;
    tabs: {
      appearance: string;
      workspace: string;
      processing: string;
      system: string;
      modules: string;
      updates: string;
      feedback: string;
    };
    appearance: {
      skinTitle: string;
      skinDesc: string;
      skins: {
        porcelain: { name: string; desc: string };
        carbon: { name: string; desc: string };
        swiss: { name: string; desc: string };
        system: { name: string; desc: string };
      };
      accentTitle: string;
      accentDesc: string;
      presets: {
        adaptive: string;
        vermilion: string;
        cobalt: string;
        emerald: string;
        amber: string;
        violet: string;
        rose: string;
        teal: string;
      };
      customHexLabel: string;
      contrastCheck: string;
      threeDTitle: string;
      threeDDesc: string;
      threeDLevels: {
        full: { name: string; desc: string };
        subtle: { name: string; desc: string };
        performance: { name: string; desc: string };
      };
      geometryTitle: string;
      geometryDesc: string;
      radiusLabel: string;
      radii: { sharp: string; balanced: string; soft: string };
      densityLabel: string;
      densities: { standard: string; compact: string; comfortable: string };
      localeLabel: string;
      reduceMotionLabel: string;
      reduceMotionDesc: string;
      immersiveLabel: string;
      immersiveDesc: string;
    };
    workspace: {
      studiosTitle: string;
      studiosDesc: string;
      moveUp: string;
      moveDown: string;
      pinnedTitle: string;
      pinnedDesc: string;
      maxPinsNote: string;
      profileTitle: string;
      profileDesc: string;
      exportJsonBtn: string;
      downloadJsonBtn: string;
      importPlaceholder: string;
      importBtn: string;
      importSuccess: string;
      exportCopied: string;
    };
    processing: {
      title: string;
      desc: string;
      compressionLabel: string;
      compressionDesc: string;
      compressionOptions: { medium: string; high: string; low: string };
      ocrLangLabel: string;
      ocrLangDesc: string;
      ocrOptions: { spa: string; eng: string };
      dpiLabel: string;
      dpiDesc: string;
      dpiOptions: { '300': string; '150': string; '72': string };
      patternLabel: string;
      patternDesc: string;
      previewLabel: string;
      cacheTitle: string;
      cacheDesc: string;
      clearCacheBtn: string;
      cacheCleared: string;
    };
    modules: {
      title: string;
      desc: string;
      openCenterBtn: string;
      telemetryTitle: string;
      localGuaranteeTitle: string;
      localGuaranteeDesc: string;
    };
    updates: {
      title: string;
      desc: string;
      checking: string;
      checkNow: string;
      installedVersion: string;
      officialChannel: string;
      connectionStatus: string;
      serverActive: string;
      offlineMode: string;
      autoCheckLabel: string;
      autoCheckDesc: string;
      modeLabel: string;
      modeDesc: string;
      modes: {
        notify: { title: string; desc: string };
        auto: { title: string; desc: string };
        manual: { title: string; desc: string };
      };
      shaBadge: string;
      manualDownloadsHint: string;
      viewAllReleases: string;
    };
    desktop: {
      lifecycleTitle: string;
      lifecycleDesc: string;
      closeModeLabel: string;
      closeCompleteTitle: string;
      closeCompleteDesc: string;
      keepBgTitle: string;
      keepBgDesc: string;
      autostartLabel: string;
      autostartDesc: string;
      startMinimizedLabel: string;
      startMinimizedDesc: string;
      contextMenuLabel: string;
      contextMenuDesc: string;
      storageSaveTitle: string;
      storageSaveDesc: string;
      saveModeAskTitle: string;
      saveModeAskDesc: string;
      saveModeFixedTitle: string;
      saveModeFixedDesc: string;
      defaultOutputDirLabel: string;
      openOutputFolderBtn: string;
      smartZipLabel: string;
      smartZipDesc: string;
      cleanOnExitLabel: string;
      cleanOnExitDesc: string;
      localStorageTitle: string;
      localStorageDesc: string;
      diskFreeLabel: string;
      tempSizeLabel: string;
      sessionSizeLabel: string;
      modelsSizeLabel: string;
      recipesSizeLabel: string;
      lowSpaceAlert: string;
      openDataFolderBtn: string;
      purgeTempBtn: string;
      purgedSuccess: string;
      savedNotice: string;
      offlineWarning: string;
    };
    feedback: {
      title: string;
      desc: string;
      categories: {
        feature: { title: string; desc: string };
        bug: { title: string; desc: string };
        opinion: { title: string; desc: string };
      };
      titleLabel: string;
      descLabel: string;
      emailLabel: string;
      includeDiag: string;
      submitLocal: string;
      submitting: string;
      openGithub: string;
      copyMarkdown: string;
      communityTitle: string;
    };
  };
  pipelines: {
    title: string;
    subtitle: string;
    badge: string;
    blueprintsTitle: string;
    launchActiveStep: string;
    stepActive: string;
    stepPhase2: string;
    items: {
      id: string;
      title: string;
      description: string;
      steps: { label: string; href?: string; status: 'active' | 'phase2' }[];
    }[];
  };
  roadmap: {
    title: string;
    subtitle: string;
    summaryTitle: string;
    activeNow: string;
    upcomingPhase2: string;
    totalManifest: string;
    filterAll: string;
    targetLabel: string;
    engineLabel: string;
  };
}

export const es: TranslationDictionary = {
  brand: {
    name: 'Tornio',
    subtitle: 'Estudio local de archivos',
    localBadge: '127.0.0.1 · Local',
    engineChipOnline: '127.0.0.1 · Local',
    engineChipOffline: '127.0.0.1 · Sin conexión',
    engineChipChecking: 'Verificando motor...',
  },
  common: {
    active: 'Activo',
    phase2: 'En desarrollo',
    online: 'Online',
    offline: 'Offline',
    all: 'Todo',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    download: 'Descargar',
    delete: 'Eliminar',
    clear: 'Limpiar',
    retry: 'Reintentar',
    ready: 'Listo',
    pending: 'Pendiente',
    installing: 'Instalando',
    connected: 'Conectado',
    disconnected: 'Desconectado',
    backHome: 'Volver al inicio',
    openSettings: 'Ajustes',
    openTray: 'Abrir Archivos de la Sesión',
    sendToTray: 'Guardar en la sesión',
    pinShortcut: 'Anclar acceso rápido',
    unpinShortcut: 'Desanclar acceso rápido',
    copy: 'Copiar',
    copied: 'Copiado',
    loading: 'Cargando...',
    files: 'archivos',
    bytes: 'bytes',
    newBadge: 'Nuevo',
    noResults: 'Sin resultados',
    loadMore: 'Cargar más',
    loadingMore: 'Cargando más...',
    revalidating: 'Sincronizando...',
    abort: 'Abortar',
    aborted: 'Operación cancelada',
    confirmTitle: 'Confirmar acción',
    allStudiosReset: 'Todos',
  },
  nav: {
    home: 'Inicio',
    workspace: 'Archivos de Sesión',
    pipelines: 'Flujos Automáticos',
    roadmap: 'Catálogo Completo',
    settings: 'Ajustes',
    suggestFeedback: 'Sugerir / Opinión',
    studiosSection: 'Estudios',
    pinnedSection: 'Anclados',
    enginesLabel: 'Motores locales',
    collapseSidebar: 'Contraer barra lateral',
    expandSidebar: 'Expandir barra lateral',
    searchTrigger: 'Buscar o ejecutar...',
    jobQueue: 'Cola de trabajos',
    languageToggle: 'Cambiar idioma a Inglés',
    skinToggle: 'Cambiar tema visual',
    skins: {
      porcelain: 'Porcelana',
      carbon: 'Carbón',
      swiss: 'Grafito Suizo',
      system: 'Sistema',
    },
  },
  studios: {
    documents: {
      name: 'Documentos y PDF',
      tagline: 'Edición, OCR y firma PDF',
      description: 'Edición, compresión, OCR, firma manuscrita, censura irreversible y conversión documental en local.',
    },
    video: {
      name: 'Estudio de Video',
      tagline: 'Recorte y exportación FFmpeg',
      description: 'Recorte visual IN/OUT, transcodificación MP4/WebM/MKV/GIF y análisis ffprobe con progreso en vivo.',
    },
    audio: {
      name: 'Estudio de Audio',
      tagline: 'Conversión y limpieza sonora',
      description: 'Conversión lossless, normalización EBU R128, reducción de ruido y edición de etiquetas.',
    },
    images: {
      name: 'Estudio de Imágenes',
      tagline: 'Formatos, EXIF y recorte',
      description: 'Conversión WebP/AVIF, limpieza de metadatos EXIF/GPS y recorte de fondo por IA ONNX.',
    },
    'files-dev': {
      name: 'Archivos y Dev Lab',
      tagline: 'Archivos, hash y utilidades',
      description: 'Inspectores ZIP/TAR, bóveda de claves, verificación SHA-256, JSON/YAML/CSV y laboratorio Regex.',
    },
    'ai-local': {
      name: 'IA Local',
      tagline: 'Voz y lectura sin conexión',
      description: 'Transcripción privada Whisper CPU, síntesis vocal local, resumen documental y segmentación RAG.',
    },
    'web-online': {
      name: 'Captura Web y Red',
      tagline: 'Captura web controlada',
      description: 'Archivado de streams con yt-dlp, extracción de artículos a Markdown e inspección segura anti-SSRF.',
    },
  },
  categories: {
    todas: 'Todas',
    organizar: 'Organizar',
    optimizar: 'Optimizar',
    convertir: 'Convertir',
    editar: 'Editar',
    seguridad: 'Seguridad',
    'video-core': 'Estudio',
    ai: 'IA Local',
    online: 'Online',
  },
  tools: {
    'merge-pdf': {
      name: 'Unir PDF',
      description: 'Une varios archivos PDF y ordénalos exactamente como necesites en segundos.',
    },
    'split-pdf': {
      name: 'Dividir PDF',
      description: 'Extrae rangos específicos o divide cada página en un archivo independiente.',
    },
    'organize-pdf': {
      name: 'Organizar PDF',
      description: 'Previsualiza miniaturas, reordena arrastrando, rota páginas individuales o elimina sobrantes.',
    },
    'rotate-pdf': {
      name: 'Rotar PDF',
      description: 'Gira todas las páginas de tu documento PDF 90, 180 o -90 grados al instante.',
    },
    'compress-pdf': {
      name: 'Comprimir PDF',
      description: 'Reduce el peso del PDF con niveles rápido, equilibrado o máximo con optimización de imágenes.',
    },
    'ocr-pdf': {
      name: 'OCR PDF',
      description: 'Reconoce texto en documentos escaneados para hacerlos seleccionables y buscables.',
    },
    'pdf-to-word': {
      name: 'PDF a Word',
      description: 'Convierte archivos PDF en documentos Word (.docx) editables conservando la estructura.',
    },
    'word-to-pdf': {
      name: 'Word a PDF',
      description: 'Convierte documentos Word (.doc, .docx) a PDF manteniendo el diseño original.',
    },
    'jpg-to-pdf': {
      name: 'JPG a PDF',
      description: 'Empaqueta una o varias imágenes JPG y PNG en un único documento PDF.',
    },
    'pdf-to-jpg': {
      name: 'PDF a JPG',
      description: 'Exporta cada página del documento PDF como imagen JPG de alta resolución.',
    },
    'pdf-to-markdown': {
      name: 'PDF a Markdown',
      description: 'Extrae el contenido del PDF a texto estructurado en Markdown (.md) listo para notas o IA.',
    },
    'url-to-pdf': {
      name: 'Web / URL a PDF',
      description: 'Captura y convierte cualquier página web pública, artículo o documentación en línea a PDF limpio.',
    },
    'translate-pdf': {
      name: 'Traducir PDF',
      description: 'Traduce el contenido de tu PDF a múltiples idiomas generando versión traducida o bilingüe.',
    },
    'watermark-pdf': {
      name: 'Marca de Agua',
      description: 'Estampa texto diagonal personalizado como marca de agua en todas las páginas.',
    },
    'page-numbers-pdf': {
      name: 'Números de Página',
      description: 'Numera automáticamente todas las páginas del documento con tipografía limpia.',
    },
    'metadata-pdf': {
      name: 'Editar Metadatos',
      description: 'Inspecciona, modifica o limpia propiedades ocultas como título, autor y palabras clave.',
    },
    'qr-pdf': {
      name: 'Código QR en PDF',
      description: 'Genera y estampa códigos QR verificados en línea o audita los existentes en el PDF.',
    },
    'sign-pdf': {
      name: 'Firmar / Sellar PDF',
      description: 'Dibuja tu firma manuscrita o sube una imagen de sello corporativo para estamparla.',
    },
    'redact-pdf': {
      name: 'Censurar / Redactar PDF',
      description: 'Elimina de forma física e irreversible textos confidenciales, correos, teléfonos o DNI.',
    },
    'protect-pdf': {
      name: 'Proteger PDF',
      description: 'Cifra el archivo PDF con contraseña AES para impedir accesos no autorizados.',
    },
    'unlock-pdf': {
      name: 'Desbloquear PDF',
      description: 'Elimina la contraseña de apertura y restricciones de un PDF cuando tienes autorización.',
    },
    'pdf-diff': {
      name: 'Comparar PDF Visual',
      description: 'Superposición pixel a pixel y diferencias textuales entre dos revisiones de un PDF.',
    },
    'pdf-tables-csv': {
      name: 'Tablas PDF a CSV',
      description: 'Detecta y exporta tablas estructuradas desde facturas y reportes a hojas CSV.',
    },
    'pdf-repair': {
      name: 'Reparar y Linealizar PDF',
      description: 'Reconstruye tablas xref dañadas y optimiza el documento para carga rápida.',
    },
    'video-studio': {
      name: 'Estudio de Video',
      description: 'Inspecciona con ffprobe, recorta IN/OUT visualmente, silencia audio o convierte a MP4, WebM, MKV o GIF.',
    },
    'video-to-gif': {
      name: 'Video a GIF Palette',
      description: 'Generación de GIF en dos pasadas con paleta adaptativa de alta nitidez.',
    },
    'video-extract-audio': {
      name: 'Extraer Pista de Audio',
      description: 'Separa la pista de audio en MP3, WAV o FLAC sin re-codificar el video.',
    },
    'video-compress': {
      name: 'Compresor por Peso',
      description: 'Ajusta el bitrate automáticamente para alcanzar un tamaño objetivo en MB.',
    },
    'video-thumbnails': {
      name: 'Hoja de Contactos',
      description: 'Extrae fotogramas clave o genera una cuadrícula de vista previa del clip.',
    },
    'video-burn-subtitles': {
      name: 'Incrustar Subtítulos',
      description: 'Renderiza archivos SRT o VTT directamente sobre el flujo de video.',
    },
    'video-merge': {
      name: 'Unir Clips de Video',
      description: 'Concatena múltiples secuencias con ajuste uniforme de resolución y FPS.',
    },
    'video-speed': {
      name: 'Velocidad y Reversa',
      description: 'Acelera en timelapse, ralentiza o invierte reproducción de clips.',
    },
    'audio-convert': {
      name: 'Convertidor de Audio',
      description: 'Transcodifica entre WAV, MP3, FLAC, OGG y M4A con control de bitrate.',
    },
    'audio-trim': {
      name: 'Recortar Audio',
      description: 'Corta segmentos exactos con fundidos suaves de entrada y salida.',
    },
    'audio-normalize': {
      name: 'Normalizar EBU R128',
      description: 'Nivela la sonoridad integrada a -14 LUFS o -16 LUFS para podcasts y voz.',
    },
    'audio-denoise': {
      name: 'Limpieza Vocal',
      description: 'Filtra zumbido eléctrico, ruido de fondo y frecuencias parásitas.',
    },
    'audio-merge': {
      name: 'Unir Pistas',
      description: 'Combina múltiples clips de audio en secuencia o mezcla por canales.',
    },
    'audio-metadata': {
      name: 'Editor de Etiquetas ID3',
      description: 'Edita artista, álbum, año y carátula incrustada en archivos de audio.',
    },
    'image-convert': {
      name: 'Convertidor WebP / AVIF',
      description: 'Convierte lotes de imágenes entre PNG, JPG, WebP, AVIF y TIFF.',
    },
    'image-compress': {
      name: 'Optimizador de Imágenes',
      description: 'Comprime fotos e ilustraciones manteniendo nitidez perceptiva.',
    },
    'image-resize-crop': {
      name: 'Redimensionar y Recortar',
      description: 'Ajusta dimensiones por píxeles, porcentaje o relación de aspecto.',
    },
    'image-exif-strip': {
      name: 'Limpiar EXIF y GPS',
      description: 'Elimina coordenadas geográficas, modelo de cámara y metadatos privados.',
    },
    'image-bg-remove': {
      name: 'Quitar Fondo IA (ONNX)',
      description: 'Segmentación local de sujetos con modelo U2NetP sin enviar imágenes a la nube.',
    },
    'image-ico-favicon': {
      name: 'Generador ICO / Favicon',
      description: 'Empaqueta iconos multi-resolución para web y aplicaciones de escritorio.',
    },
    'image-palette': {
      name: 'Inspector de Paleta',
      description: 'Extrae colores dominantes en HEX/RGB e histograma tonal de cualquier imagen.',
    },
    'archive-pack': {
      name: 'Empaquetar e Inspeccionar ZIP',
      description: 'Inspecciona el árbol interno de archivos comprimidos sin extraer basura al disco.',
    },
    'file-hash-verify': {
      name: 'Verificador SHA-256',
      description: 'Calcula y compara huellas criptográficas locales para validar descargas.',
    },
    'file-vault': {
      name: 'Bóveda Cifrada Local',
      description: 'Cifra y descifra archivos individuales con contraseña AES-GCM 100% offline.',
    },
    'data-transform': {
      name: 'Conversor JSON / YAML / CSV',
      description: 'Formatea, valida esquemas y transforma datos tabulares o estructurados.',
    },
    'regex-diff-lab': {
      name: 'Laboratorio Diff y Regex',
      description: 'Compara textos línea a línea y depura expresiones regulares sin conexión.',
    },
    'qr-barcode-batch': {
      name: 'Generador QR por Lotes',
      description: 'Genera códigos QR vectoriales SVG o PNG en serie desde listas CSV.',
    },
    'ai-transcribe': {
      name: 'Transcripción Whisper CPU',
      description: 'Convierte voz de audio o video a texto y subtítulos SRT 100% offline.',
    },
    'ai-tts-local': {
      name: 'Síntesis Vocal Local (TTS)',
      description: 'Convierte texto y apuntes Markdown en locución WAV offline sin enviar datos.',
    },
    'ai-doc-summary': {
      name: 'Resumen Documental Local',
      description: 'Extrae puntos clave y glosarios estructurados con modelos locales.',
    },
    'ai-doc-chunks': {
      name: 'Dividir Documento en Bloques',
      description: 'Divide PDFs y textos largos en fragmentos ordenados listos para análisis o IA.',
    },
    'yt-dlp-capture': {
      name: 'Archivador yt-dlp',
      description: 'Descarga controlada de video o audio desde fuentes web soportadas a la Bandeja.',
    },
    'web-markdown-clip': {
      name: 'Web a Markdown Limpio',
      description: 'Extrae contenido editorial sin publicidad ni rastreadores en formato Markdown.',
    },
    'web-headers-ssl': {
      name: 'Inspector HTTP / Redirects',
      description: 'Analiza saltos de redirección, cabeceras y estado TLS con protección anti-SSRF.',
    },
  },
  home: {
    greeting: 'Tornio',
    greetingFallback: 'Tornio',
    greetingMorning: 'Buenos días',
    greetingAfternoon: 'Buenas tardes',
    greetingEvening: 'Buenas noches',
    heroTitle: 'Elige un estudio o suelta un archivo para empezar.',
    heroSubtitle: 'Elige un estudio o suelta un archivo para empezar.',
    orbStatusIdle: 'Motor local en espera',
    orbStatusRunning: 'Procesamiento en curso',
    orbStatusOffline: 'Motor local desconectado',
    quickLaunchTitle: 'Estudios',
    quickLaunchSubtitle: 'Espacios de trabajo por tipo de archivo.',
    dropzoneTitle: 'Inspección rápida',
    dropzoneSubtitle: 'Suelta cualquier archivo para ver sus detalles y abrir la herramienta adecuada.',
    dropzoneButton: 'Examinar archivo',
    dropzoneInspecting: 'Inspeccionando archivo localmente...',
    dropzoneFormatsHint: 'Inspección local instantánea · Cero subida externa',
    inspectedAssetTitle: 'Último archivo inspeccionado',
    suggestedActions: 'Acciones sugeridas',
    viewAllTray: 'Ver Archivos de Sesión',
    pinnedTitle: 'Accesos rápidos',
    pinnedSubtitle: 'Atajos fijados con Alt+N para abrir herramientas al instante.',
    browseDocuments: 'Explorar Documentos y PDF',
    managePins: 'Configurar anclados',
    studioToolsSection: 'Herramientas del estudio',
    studioUpcomingNotice: 'Este estudio incorpora nuevos módulos locales en las próximas actualizaciones v3.x.',
    openVideoWorkbench: 'Abrir mesa de edición FFmpeg',
    videoWorkbenchHint: 'Recorte visual IN/OUT, análisis ffprobe y exportación en cola.',
    catalogTitle: 'Herramientas disponibles',
    catalogSubtitle: 'Herramientas locales listas para trabajar sin subidas externas.',
    searchPlaceholder: 'Filtrar por herramienta, estudio, formato o motor...',
    clearFilters: 'Limpiar filtros',
    toolsCountSuffix: 'herramientas',
    phase2ModalTitle: 'Módulo en desarrollo',
    phase2ModalBody: 'Esta herramienta forma parte de la arquitectura modular de Tornio v3 y se activará en próximas actualizaciones manteniendo compatibilidad con tus Archivos de Sesión.',
    phase2ModalTarget: 'Entrega estimada',
    phase2ModalOpenRoadmap: 'Ver Roadmap completo (58 módulos)',
    phase2ModalOpenModules: 'Preparar motores locales',
    telemetryCpu: 'CPU',
    telemetryRam: 'RAM',
    telemetryTemp: 'Temporales',
    activeLabel: 'activas',
    profilesLabel: 'Adaptar interfaz a mi rubro:',
    profiles: {
      all: 'Todo en Uno',
      office: 'Oficina y Legal',
      student: 'Estudiante y Académico',
      creator: 'Creación y Diseño',
      developer: 'IT y Desarrollo',
    },
    orbPopover: {
      title: 'Núcleo de Precisión · 127.0.0.1',
      statusOnline: 'Motor local en línea',
      statusRunning: 'Procesando archivo(s)',
      statusOffline: 'Motor local desconectado',
      dropHint: 'Suelta cualquier archivo sobre el núcleo para inspeccionarlo',
      enginesLabel: 'Motores activos',
      cpuLabel: 'CPU',
      ramLabel: 'RAM',
      diskFreeLabel: 'Disco libre',
      viewJobs: 'Ver cola de trabajos',
      purgeTemp: 'Liberar temporales',
      configureEngines: 'Configurar motores',
      desktopSettings: 'Sistema y Escritorio',
    },
    studioEvolutionNotice: 'Tornio v3.0 · 58 herramientas locales activas. Próximas actualizaciones sumarán nuevos flujos impulsados por la comunidad.',
    proposeToolBtn: 'Proponer una herramienta',
    viewRoadmapLink: 'Explorar Roadmap',
  },
  quickFeedback: {
    title: 'Enviar sugerencia u opinión',
    subtitle: 'Cuéntanos qué herramienta nueva te ahorraría tiempo o si algo no funcionó como esperabas.',
    types: {
      feature: { title: 'Pedir herramienta', desc: '¿Qué formato o tarea te gustaría?' },
      bug: { title: 'Reportar problema', desc: 'Algo falló o se vio extraño' },
      opinion: { title: 'Dar una idea', desc: 'Mejoras de diseño o uso diario' },
    },
    subjectLabel: '¿En pocas palabras, qué necesitas?',
    subjectPlaceholder: 'Ej. Convertir libros EPUB a PDF, recortar marcas...',
    detailsLabel: 'Detalles (opcionalmente explica cómo lo usarías)',
    detailsPlaceholder: 'Describe brevemente tu idea o los pasos para reproducir el problema...',
    saveLocalBtn: 'Guardar sugerencia',
    savingBtn: 'Guardando...',
    publishGithubBtn: 'Publicar en GitHub',
    githubHint: 'Guarda en tu equipo o abre un formulario listo en GitHub en 1 clic.',
    savedToast: 'Sugerencia guardada correctamente.',
  },
  workspace: {
    title: 'Archivos de la Sesión',
    subtitle: 'Tus archivos recientes y resultados procesados, listos para abrirlos en cualquier herramienta sin volver a buscarlos en tu PC.',
    emptyTitle: 'Aún no hay archivos en esta sesión',
    emptySubtitle: 'Arrastra cualquier documento, video, audio o imagen para ver sus detalles y enviarlo a una herramienta en 1 clic.',
    clearAll: 'Limpiar lista',
    confirmClearAll: 'Deseas quitar todos los archivos de la sesión actual?',
    filterAll: 'Todos',
    domains: {
      pdf: 'PDF',
      video: 'Video',
      audio: 'Audio',
      image: 'Imagen',
      archive: 'Archivo',
      data: 'Datos',
      other: 'Otro',
    },
    metadataTitle: 'Detalles del archivo',
    sha256Label: 'Huella SHA-256',
    suggestedToolsLabel: 'Herramientas recomendadas para este archivo',
    openInToolLabel: 'Abrir en herramienta',
    downloadAsset: 'Guardar copia',
    deleteAsset: 'Quitar de la lista',
    uploadMore: 'Agregar archivos',
    noSuggestedActive: 'Selecciona una herramienta del menú lateral para procesar este archivo.',
    openVideoStudio: 'Abrir en Estudio de Video',
  },
  videoStudio: {
    title: 'Estudio de Video',
    subtitle: 'Edición, recorte y conversión local de video con progreso en tiempo real.',
    emptyTitle: 'Carga un video para recortar o convertir',
    emptySubtitle: 'Selecciona un clip desde tu equipo o elige un video cargado en Archivos de la Sesión.',
    pickFromTray: 'Videos en la sesión',
    uploadVideoBtn: 'Seleccionar video',
    engineMissingTitle: 'Motor FFmpeg pendiente de activar',
    engineMissingDesc: 'Para analizar y exportar video necesitas conectar o instalar FFmpeg en 1 clic.',
    metadataTitle: 'Detalles del video',
    duration: 'Duración',
    resolution: 'Resolución',
    fps: 'FPS',
    videoCodec: 'Formato Video',
    audioCodec: 'Formato Audio',
    bitrate: 'Bitrate',
    noAudioTrack: 'Sin pista de audio',
    trimSection: 'Recorte de tiempo (Inicio / Fin)',
    trimIn: 'Inicio (IN)',
    trimOut: 'Fin (OUT)',
    trimDuration: 'Segmento',
    jumpIn: 'Ir a IN',
    jumpOut: 'Ir a OUT',
    previewRange: 'Reproducir segmento',
    resetTrim: 'Restablecer rango',
    inspectorTitle: 'Opciones de exportación',
    outputFormat: 'Formato de salida',
    qualityLabel: 'Calidad',
    qualities: {
      high: 'Alta (Máxima nitidez)',
      medium: 'Media (Recomendada)',
      compact: 'Compacta (Menor peso)',
    },
    resolutionLabel: 'Resolución',
    resolutions: {
      original: 'Original del clip',
      '1080': '1080p Full HD',
      '720': '720p HD',
      '480': '480p SD',
    },
    removeAudio: 'Silenciar video (Quitar audio)',
    removeAudioHint: 'Genera un clip sin sonido.',
    fastCopy: 'Corte instantáneo (Sin perder calidad)',
    fastCopyHint: 'Recorta al instante en MP4/MKV cuando mantienes la resolución original.',
    dispatchBtn: 'Procesar video',
    dispatchingBtn: 'Iniciando proceso...',
    jobDispatchedToast: 'Video en proceso.',
    changeVideo: 'Cambiar video',
    inspectingMeta: 'Analizando detalles del video...',
    activeJobsForVideo: 'Procesos recientes de video',
  },
  jobs: {
    drawerTitle: 'Procesos y Descargas',
    sseLive: 'En tiempo real',
    sseOffline: 'En espera',
    ssePaused: 'Pausado',
    pauseStream: 'Pausar',
    resumeStream: 'Reanudar',
    emptyTitle: 'No hay procesos activos',
    emptySubtitle: 'Las tareas largas (como exportación de video) mostrarán aquí su avance y botón de descarga.',
    statuses: {
      queued: 'En fila',
      running: 'Procesando',
      completed: 'Listo',
      failed: 'Error',
      cancelled: 'Cancelado',
    },
    cancelJob: 'Cancelar',
    downloadResult: 'Descargar resultado',
    chainToTray: 'Ver en Archivos de Sesión',
    chainToVideo: 'Volver a Estudio de Video',
    removeJob: 'Quitar de la lista',
    elapsed: 'Tiempo',
    outputSize: 'Tamaño',
  },
  modulesModal: {
    title: 'Centro de Motores Locales',
    subtitle: 'Conecta o instala en 1 clic los 6 motores opcionales de Tornio sin abrir consolas.',
    rescanSystem: 'Re-escanear sistema',
    rescanDone: 'Escaneo del sistema completado.',
    rescanError: 'No se pudo conectar con el motor local para escanear.',
    doneBtn: 'Listo',
    statusReady: 'Conectado',
    statusInstalling: 'Instalando...',
    statusPending: 'Pendiente',
    installComplete: 'Proceso completado',
    installNotice: 'Aviso de instalación',
    installingBanner: 'Instalando y conectando automáticamente...',
    activeEngine: 'Motor activo',
    linkedPath: 'Ruta vinculada',
    detectedLangs: 'Idiomas OCR detectados',
    installSpanishBtn: 'Instalar idioma Español (1 clic)',
    changeBinaryManual: 'Cambiar ejecutable manualmente',
    resetAutoDetect: 'Restablecer detección automática',
    optionATitle: 'Opción A — Instalación en 1 Clic',
    optionABadge: 'Sin consola',
    optionAButton: 'Instalar automáticamente',
    optionBTitle: 'Opción B — Ya lo tengo',
    optionBDesc: 'Escanea rutas estándar, WinGet y Registro de Windows.',
    optionBButton: 'Autodetectar',
    optionCTitle: 'Opción C — Vincular binario',
    optionCDesc: 'Elige manualmente un ejecutable o carpeta portable.',
    optionCButton: 'Seleccionar .exe...',
    manualPathLabel: 'Ruta de carpeta o ejecutable',
    manualPathLink: 'Vincular',
    installStartedToast: 'Instalación iniciada en segundo plano.',
    installErrorToast: 'No se pudo iniciar la instalación automática.',
    binaryLinkedToast: 'Ruta vinculada y verificada correctamente.',
    binaryClearedToast: 'Configuración restablecida a detección automática.',
    wingetUnavailable: 'WinGet no detectado en este equipo; usa ruta manual o selector de binario.',
    items: {
      ocr: {
        title: 'Tesseract OCR',
        shortTitle: 'OCR',
        subtitle: 'Reconocimiento óptico de texto en documentos escaneados.',
        installDesc: 'Descarga e instala Tesseract OCR con paquetes de idioma Español e Inglés.',
        placeholderPath: 'Ej. C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
      },
      word_to_pdf: {
        title: 'Word / LibreOffice Headless',
        shortTitle: 'Word a PDF',
        subtitle: 'Conversión de archivos .doc y .docx a PDF conservando diseño.',
        installDesc: 'Instala LibreOffice de forma desatendida y lo vincula automáticamente.',
        placeholderPath: 'Ej. C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      },
      ffmpeg: {
        title: 'FFmpeg + ffprobe',
        shortTitle: 'FFmpeg',
        subtitle: 'Motor multimedia para Estudio de Video, recorte y transcodificación.',
        installDesc: 'Instala Gyan.FFmpeg vía WinGet y habilita ffprobe en todo Tornio.',
        placeholderPath: 'Ej. C:\\ffmpeg\\bin\\ffmpeg.exe',
      },
      yt_dlp: {
        title: 'yt-dlp Stream Engine',
        shortTitle: 'yt-dlp',
        subtitle: 'Captura local de streams multimedia desde enlaces públicos.',
        installDesc: 'Instala yt-dlp en tu directorio local de binarios o vía WinGet.',
        placeholderPath: 'Ej. C:\\Users\\Usuario\\AppData\\Local\\Tornio\\bin\\yt-dlp.exe',
      },
      rembg_onnx: {
        title: 'ONNX Background Matting (u2netp)',
        shortTitle: 'Rembg ONNX',
        subtitle: 'Eliminación neuronal de fondos en imágenes sin conexión.',
        installDesc: 'Descarga el modelo u2netp.onnx en la carpeta local de modelos de Tornio.',
        placeholderPath: '',
      },
      whisper_cpu: {
        title: 'Whisper CPU (faster-whisper)',
        shortTitle: 'Whisper CPU',
        subtitle: 'Transcripción privada de audio y video a texto sin GPU obligatoria.',
        installDesc: 'Prepara un entorno Python aislado con faster-whisper en módulos locales.',
        placeholderPath: '',
      },
    },
  },
  commandPalette: {
    ariaLabel: 'Paleta rápida de herramientas y comandos',
    placeholder: 'Ir a herramienta, estudio o ejecutar comando (ej. video, OCR, idioma, skin)...',
    clearInput: 'Limpiar texto',
    noResults: 'No se encontraron herramientas ni comandos para',
    toolsGroup: 'Herramientas y Estudios',
    actionsGroup: 'Acciones del Sistema',
    footerHint: 'Arriba/Abajo para navegar · Enter para abrir · Alt+1..9 accesos anclados',
    actions: {
      modules: {
        label: 'Abrir Centro de Motores Locales',
        description: 'Instalar o conectar Tesseract, LibreOffice, FFmpeg, yt-dlp, ONNX y Whisper',
      },
      workspace: {
        label: 'Ir a Archivos de Sesión',
        description: 'Inspeccionar archivos cargados y encadenar herramientas',
      },
      videoStudio: {
        label: 'Abrir Estudio de Video',
        description: 'Recortar y convertir clips localmente con FFmpeg',
      },
      jobDrawer: {
        label: 'Alternar Cola de Trabajos SSE',
        description: 'Ver progreso en vivo y descargar trabajos completados',
      },
      toggleLocale: {
        label: 'Switch Language to English (EN)',
        description: 'Cambia instantáneamente toda la interfaz a inglés',
      },
      cycleSkin: {
        label: 'Rotar Skin Visual (Porcelain / Carbon / Swiss)',
        description: 'Cambia inmediatamente la paleta arquitectónica del espacio',
      },
      immersiveOn: {
        label: 'Activar Modo Inmersivo',
        description: 'Pantalla completa para máxima concentración',
      },
      immersiveOff: {
        label: 'Salir de Modo Inmersivo',
        description: 'Restaurar vista de ventana estándar',
      },
      settings: {
        label: 'Ajustes y Personalización',
        description: 'Skins, acento HEX, nivel 3D, módulos y perfil JSON',
      },
    },
  },
  settings: {
    title: 'Ajustes y Personalización',
    subtitle: 'Configura la estética de Tornio, organiza tus Estudios, gestiona los 6 motores locales y exporta tu perfil.',
    checkUpdatesBtn: 'Buscar actualizaciones',
    resetDefaults: 'Restablecer valores',
    resetConfirm: 'Deseas restablecer todos los ajustes a los valores de fábrica?',
    resetSuccess: 'Ajustes restablecidos correctamente.',
    savedLocallyNote: 'Los cambios se guardan automáticamente en este equipo (tornio-user-settings-v3).',
    tabs: {
      appearance: 'Apariencia y 3D',
      workspace: 'Estudios y Perfil',
      processing: 'Procesamiento',
      system: 'Sistema y Escritorio',
      modules: 'Motores (6)',
      updates: 'Actualizaciones',
      feedback: 'Opiniones',
    },
    appearance: {
      skinTitle: 'Skin Arquitectónico',
      skinDesc: 'Elige entre la claridad Porcelana, oscuridad pura Carbón o precisión Grafito Suizo.',
      skins: {
        porcelain: { name: 'Porcelana', desc: 'Papel editorial #FAF9F7 / #FFFFFF' },
        carbon: { name: 'Carbón', desc: 'Grafito calibrado #0C0C0E / #141417' },
        swiss: { name: 'Grafito Suizo', desc: 'Piedra técnica cálida #EEEDE8' },
        system: { name: 'Sistema', desc: 'Sincroniza Porcelana / Carbón con el SO' },
      },
      accentTitle: 'Color de Acento y Contraste Automático',
      accentDesc: 'Personaliza el color activo con cálculo automático de contraste WCAG para textos y botones.',
      presets: {
        adaptive: 'Monocromo Adaptativo',
        vermilion: 'Bermellón Editorial',
        cobalt: 'Cobalto Corporativo',
        emerald: 'Esmeralda Natural',
        amber: 'Ámbar Cálido',
        violet: 'Lavanda / Violeta',
        rose: 'Rosa Cuarzo',
        teal: 'Turquesa Océano',
      },
      customHexLabel: 'Selector HEX personalizado',
      contrastCheck: 'Contraste calculado sobre el acento',
      threeDTitle: 'Acabado Visual y Profundidad',
      threeDDesc: 'Controla el estilo de las tarjetas e iconos de los estudios.',
      threeDLevels: {
        full: { name: 'Moderno 3D', desc: 'Efecto de luz e inclinación suave al pasar el cursor' },
        subtle: { name: 'Equilibrado', desc: 'Iconos multicapa con elevación discreta' },
        performance: { name: 'Sobrio / Plano', desc: 'Tarjetas estáticas de máxima sobriedad' },
      },
      geometryTitle: 'Tamaño de Texto, Geometría e Idioma',
      geometryDesc: 'Adapta el tamaño de lectura para cualquier edad, radio de esquinas y preferencias de movimiento.',
      radiusLabel: 'Radio de bordes',
      radii: { sharp: 'Recto (4px)', balanced: 'Equilibrado (12px)', soft: 'Suave (20px)' },
      densityLabel: 'Tamaño y comodidad de lectura',
      densities: {
        standard: 'Estándar',
        compact: 'Compacto (Alta densidad)',
        comfortable: 'Cómodo (Texto amplio)',
      },
      localeLabel: 'Idioma de la aplicación',
      reduceMotionLabel: 'Reducir animaciones',
      reduceMotionDesc: 'Desactiva transiciones y movimiento continuo en toda la interfaz.',
      immersiveLabel: 'Modo inmersivo al iniciar',
      immersiveDesc: 'Solicita pantalla completa al abrir la aplicación.',
    },
    workspace: {
      studiosTitle: 'Visibilidad y Orden de Estudios',
      studiosDesc: 'Activa o reordena los 7 Estudios mostrados en la barra lateral y la vista de inicio.',
      moveUp: 'Subir',
      moveDown: 'Bajar',
      pinnedTitle: 'Accesos Anclados (Alt + 1..9)',
      pinnedDesc: 'Pulsa Alt+1 hasta Alt+9 desde cualquier pantalla para saltar instantáneamente a estas herramientas.',
      maxPinsNote: 'Hasta 9 herramientas ancladas activas simultáneamente.',
      profileTitle: 'Portabilidad de Perfil (JSON)',
      profileDesc: 'Exporta tu configuración completa o impórtala en otra instalación local de Tornio.',
      exportJsonBtn: 'Copiar JSON al portapapeles',
      downloadJsonBtn: 'Descargar perfil .json',
      importPlaceholder: 'Pega aquí el JSON de configuración de Tornio...',
      importBtn: 'Importar perfil JSON',
      importSuccess: 'Perfil importado y aplicado correctamente.',
      exportCopied: 'Perfil JSON copiado al portapapeles.',
    },
    processing: {
      title: 'Valores Predeterminados de Procesamiento',
      desc: 'Define los parámetros iniciales al abrir herramientas PDF.',
      compressionLabel: 'Nivel de compresión predeterminado',
      compressionDesc: 'Usado al iniciar Comprimir PDF.',
      compressionOptions: {
        medium: 'Media / Recomendada (Equilibrio óptimo)',
        high: 'Alta (Máxima reducción de peso)',
        low: 'Baja (Máxima fidelidad visual)',
      },
      ocrLangLabel: 'Idioma predeterminado para OCR',
      ocrLangDesc: 'Idioma inicial seleccionado en OCR PDF.',
      ocrOptions: { spa: 'Español (spa)', eng: 'Inglés (eng)' },
      dpiLabel: 'Resolución PDF a JPG',
      dpiDesc: 'Densidad por defecto al rasterizar páginas.',
      dpiOptions: {
        '300': '300 DPI (Alta resolución)',
        '150': '150 DPI (Equilibrada)',
        '72': '72 DPI (Ligera)',
      },
      patternLabel: 'Patrón de nombre de salida',
      patternDesc: 'Usa {name} como marcador del nombre original.',
      previewLabel: 'Vista previa:',
      cacheTitle: 'Caché temporal de sesión',
      cacheDesc: 'Limpia datos temporales en sessionStorage del navegador.',
      clearCacheBtn: 'Limpiar caché',
      cacheCleared: 'Caché temporal limpiada.',
    },
    modules: {
      title: 'Estado de los 6 Motores Locales',
      desc: 'Resumen en tiempo real de capacidades detectadas en tu equipo.',
      openCenterBtn: 'Abrir Centro de Motores',
      telemetryTitle: 'Telemetría de Hardware Local',
      localGuaranteeTitle: 'Garantía Local-First 127.0.0.1',
      localGuaranteeDesc: 'Todos los motores se ejecutan en tu CPU y almacenamiento local sin enviar documentos a terceros.',
    },
    updates: {
      title: 'Actualizaciones de la Aplicación',
      desc: 'Comprueba, descarga y verifica criptográficamente nuevas versiones oficiales desde GitHub Releases.',
      checking: 'Buscando en GitHub...',
      checkNow: 'Comprobar ahora',
      installedVersion: 'Versión instalada',
      officialChannel: 'Canal oficial',
      connectionStatus: 'Estado del servidor',
      serverActive: 'Motor local activo',
      offlineMode: 'Modo fuera de línea',
      autoCheckLabel: 'Comprobar automáticamente al iniciar',
      autoCheckDesc: 'Consulta silenciosa con timeout corto de 3s y fallback offline.',
      modeLabel: 'Política de actualización',
      modeDesc: 'Elige si prefieres actualizar manualmente o recibir alertas verificadas en 1 clic.',
      modes: {
        notify: {
          title: 'Notificar y actualizar en 1 clic',
          desc: 'Comprueba nuevas versiones con timeout corto y descarga solo cuando tú lo confirmes.',
        },
        auto: {
          title: 'Descarga verificada en segundo plano',
          desc: 'Descarga y valida el SHA-256 en segundo plano; instala cuando decidas reiniciar.',
        },
        manual: {
          title: 'Manual (100% sin conexión)',
          desc: 'Cero consultas de red automáticas. Ideal para entornos cerrados o auditoría estricta.',
        },
      },
      shaBadge: 'Verificación criptográfica SHA-256 obligatoria antes de instalar',
      manualDownloadsHint: 'Descargas e instaladores manuales disponibles en GitHub Releases.',
      viewAllReleases: 'Ver todas las versiones',
    },
    desktop: {
      lifecycleTitle: 'Ejecución, Segundo Plano e Integración con Windows',
      lifecycleDesc: 'Controla si Tornio permanece en la bandeja del sistema para abrir al instante o se cierra por completo.',
      closeModeLabel: 'Comportamiento al cerrar la ventana',
      closeCompleteTitle: 'Cerrar siempre por completo',
      closeCompleteDesc: 'Finaliza el motor local de inmediato y libera 100% de RAM.',
      keepBgTitle: 'Mantener en segundo plano (Bandeja)',
      keepBgDesc: 'Icono junto al reloj de Windows para apertura instantánea y menú rápido.',
      autostartLabel: 'Iniciar Tornio al encender Windows',
      autostartDesc: 'Registra el inicio rápido bajo tu usuario (HKCU, sin permisos de administrador).',
      startMinimizedLabel: 'Iniciar minimizado en segundo plano',
      startMinimizedDesc: 'Arranca en la bandeja sin mostrar ventana hasta que hagas clic o abras un archivo.',
      contextMenuLabel: 'Menú contextual "Abrir con Tornio"',
      contextMenuDesc: 'Agrega "Abrir con Tornio" al hacer clic derecho sobre archivos en el Explorador de Windows.',
      storageSaveTitle: 'Guardado Rápido y Privacidad al Salir',
      storageSaveDesc: 'Define dónde guardar tus archivos procesados y qué ocurre con los temporales.',
      saveModeAskTitle: 'Preguntar siempre dónde guardar',
      saveModeAskDesc: 'Muestra el diálogo de descarga estándar en cada resultado.',
      saveModeFixedTitle: 'Guardar directo en carpeta fija',
      saveModeFixedDesc: 'Guarda con 1 clic en la carpeta predeterminada sin sobrescribir archivos.',
      defaultOutputDirLabel: 'Carpeta predeterminada para guardado directo',
      openOutputFolderBtn: 'Abrir carpeta',
      smartZipLabel: 'Empaquetado inteligente en .ZIP',
      smartZipDesc: 'Agrupa múltiples archivos de salida en un único archivo .ZIP limpio cuando aplica.',
      cleanOnExitLabel: 'Limpiar temporales y lista de sesión al cerrar',
      cleanOnExitDesc: 'Elimina automáticamente archivos temporales y Archivos de Sesión al salir de Tornio.',
      localStorageTitle: 'Almacenamiento Local y Salud del Disco',
      localStorageDesc: 'Supervisa el espacio libre y gestiona modelos IA descargados en este equipo.',
      diskFreeLabel: 'Espacio libre',
      tempSizeLabel: 'Temporales activos',
      sessionSizeLabel: 'Archivos de sesión',
      modelsSizeLabel: 'Modelos y motores',
      recipesSizeLabel: 'Recetas de pipelines',
      lowSpaceAlert: 'Espacio libre en disco por debajo de 500 MB. Libera espacio antes de procesar video o lotes grandes.',
      openDataFolderBtn: 'Abrir carpeta de datos',
      purgeTempBtn: 'Liberar temporales',
      purgedSuccess: 'Archivos temporales eliminados correctamente.',
      savedNotice: 'Preferencia de escritorio guardada en config.json.',
      offlineWarning: 'Conecta el motor local para sincronizar las preferencias del equipo.',
    },
    feedback: {
      title: 'Opiniones y Reporte Técnico',
      desc: 'Registra comentarios en tu almacenamiento local o genera un reporte Markdown para GitHub.',
      categories: {
        feature: { title: 'Proponer Función', desc: 'Nuevas herramientas o flujos' },
        bug: { title: 'Reportar Error', desc: 'Fallos técnicos reproducibles' },
        opinion: { title: 'Dar Opinión', desc: 'Diseño y experiencia de uso' },
      },
      titleLabel: 'Título del reporte',
      descLabel: 'Descripción detallada',
      emailLabel: 'Correo de contacto (opcional)',
      includeDiag: 'Incluir diagnóstico técnico local (versión y motores activos)',
      submitLocal: 'Registrar localmente',
      submitting: 'Registrando...',
      openGithub: 'Abrir Issue en GitHub',
      copyMarkdown: 'Copiar Markdown',
      communityTitle: 'Comunidad y Código Abierto',
    },
  },
  pipelines: {
    title: 'Pipelines Locales',
    subtitle: 'Encadenamiento visual de múltiples pasos entre estudios sobre tus Archivos de Sesión.',
    badge: 'Vista previa v3.x',
    blueprintsTitle: 'Plantillas de Flujos Locales',
    launchActiveStep: 'Ejecutar paso activo ahora',
    stepActive: 'Disponible ahora',
    stepPhase2: 'En desarrollo',
    items: [
      {
        id: 'pipe-scan-secure',
        title: 'Digitalización Segura de Contratos',
        description: 'Reconoce texto escaneado, reduce el tamaño del PDF y censura datos sensibles antes de compartir.',
        steps: [
          { label: '1. OCR PDF', href: '/ocr-pdf', status: 'active' },
          { label: '2. Comprimir PDF', href: '/compress-pdf', status: 'active' },
          { label: '3. Censurar / Redactar', href: '/redact-pdf', status: 'active' },
        ],
      },
      {
        id: 'pipe-video-notes',
        title: 'Clip de Video a Transcripción y Notas',
        description: 'Recorta un fragmento con FFmpeg, extrae la pista vocal y transcribe offline con Whisper CPU.',
        steps: [
          { label: '1. Recortar en Video Studio', href: '/video-studio', status: 'active' },
          { label: '2. Extraer Audio', status: 'phase2' },
          { label: '3. Transcribir (Whisper CPU)', status: 'phase2' },
        ],
      },
      {
        id: 'pipe-image-bundle',
        title: 'Lote de Imágenes Privadas a PDF',
        description: 'Limpia coordenadas GPS EXIF, elimina fondo con ONNX y compila un catálogo PDF.',
        steps: [
          { label: '1. Limpiar EXIF / GPS', status: 'phase2' },
          { label: '2. Quitar Fondo (ONNX)', status: 'phase2' },
          { label: '3. JPG a PDF', href: '/jpg-to-pdf', status: 'active' },
        ],
      },
    ],
  },
  roadmap: {
    title: 'Roadmap y Manifiesto Modular',
    subtitle: 'Evolución de Tornio v3.0 a v3.3 cubriendo los 7 Estudios locales.',
    summaryTitle: 'Progreso de la suite',
    activeNow: 'Activas hoy (v3.0)',
    upcomingPhase2: 'En desarrollo (v3.x)',
    totalManifest: 'Manifiesto total',
    filterAll: 'Todos los estudios',
    targetLabel: 'Versión objetivo',
    engineLabel: 'Motor requerido',
  },
};
