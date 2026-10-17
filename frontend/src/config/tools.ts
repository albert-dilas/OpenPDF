export type ToolCategory =
  | 'organizar'
  | 'optimizar'
  | 'convertir'
  | 'editar'
  | 'seguridad';

export type ToolIconName =
  | 'layout-grid'
  | 'file-sliders'
  | 'pen-tool'
  | 'eye-off'
  | 'globe'
  | 'languages'
  | 'qr-code';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconUrl?: string;
  iconName?: ToolIconName;
  color: string;
  href: string;
  requiredCapability?: 'ocr' | 'word_to_pdf';
  requiresInternet?: boolean;
  isNew?: boolean;
}

export const TOOL_CATEGORIES: { id: ToolCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'organizar', label: 'Organizar' },
  { id: 'optimizar', label: 'Optimizar' },
  { id: 'convertir', label: 'Convertir' },
  { id: 'editar', label: 'Editar' },
  { id: 'seguridad', label: 'Seguridad' },
];

export const tools: ToolItem[] = [
  {
    id: 'merge-pdf',
    name: 'Unir PDF',
    description: 'Une varios archivos PDF y ponlos en el orden que prefieras en segundos.',
    category: 'organizar',
    iconUrl: '/icons/merge-pdf.png',
    color: 'bg-brand',
    href: '/merge-pdf',
  },
  {
    id: 'split-pdf',
    name: 'Dividir PDF',
    description: 'Extrae páginas específicas por rangos o convierte cada página en un archivo independiente.',
    category: 'organizar',
    iconUrl: '/icons/split-pdf.png',
    color: 'bg-orange-500',
    href: '/split-pdf',
  },
  {
    id: 'organize-pdf',
    name: 'Organizar PDF',
    description: 'Previsualiza miniaturas, reordena arrastrando, rota páginas individuales o elimina las que no necesites.',
    category: 'organizar',
    iconName: 'layout-grid',
    color: 'bg-rose-600',
    href: '/organize-pdf',
  },
  {
    id: 'rotate-pdf',
    name: 'Rotar PDF',
    description: 'Gira todas las páginas de tu documento PDF 90°, 180° o -90° al instante.',
    category: 'organizar',
    iconUrl: '/icons/rotate-pdf.png',
    color: 'bg-blue-400',
    href: '/rotate-pdf',
  },
  {
    id: 'compress-pdf',
    name: 'Comprimir PDF',
    description: 'Reduce el peso de tu PDF eligiendo entre compresión rápida, equilibrada o máxima con optimización de imágenes.',
    category: 'optimizar',
    iconUrl: '/icons/compress-pdf.png',
    color: 'bg-emerald-600',
    href: '/compress-pdf',
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Reconoce texto en documentos escaneados para hacerlos seleccionables y buscables.',
    category: 'optimizar',
    iconUrl: '/icons/ocr-pdf.png',
    color: 'bg-indigo-500',
    href: '/ocr-pdf',
    requiredCapability: 'ocr',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF a Word',
    description: 'Convierte tus PDF a documentos Word (.docx) editables conservando la estructura.',
    category: 'convertir',
    iconUrl: '/icons/pdf-to-word.png',
    color: 'bg-blue-600',
    href: '/pdf-to-word',
  },
  {
    id: 'word-to-pdf',
    name: 'Word a PDF',
    description: 'Convierte documentos Word (.doc, .docx) a PDF conservando el diseño original.',
    category: 'convertir',
    iconUrl: '/icons/word-to-pdf.png',
    color: 'bg-blue-800',
    href: '/word-to-pdf',
    requiredCapability: 'word_to_pdf',
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG a PDF',
    description: 'Convierte una o múltiples imágenes JPG y PNG en un único documento PDF.',
    category: 'convertir',
    iconUrl: '/icons/jpg-to-pdf.png',
    color: 'bg-amber-500',
    href: '/jpg-to-pdf',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF a JPG',
    description: 'Exporta cada página de tu documento PDF como imagen JPG de alta resolución (300 DPI).',
    category: 'convertir',
    iconUrl: '/icons/pdf-to-jpg.png',
    color: 'bg-yellow-500',
    href: '/pdf-to-jpg',
  },
  {
    id: 'pdf-to-markdown',
    name: 'PDF a Markdown',
    description: 'Extrae el contenido de tu PDF a texto estructurado en Markdown (.md), ideal para notas y LLMs.',
    category: 'convertir',
    iconUrl: '/icons/pdf-to-markdown.png',
    color: 'bg-indigo-600',
    href: '/pdf-to-markdown',
  },
  {
    id: 'url-to-pdf',
    name: 'Web / URL a PDF',
    description: 'Captura y convierte cualquier página web pública, artículo o documentación en línea a un documento PDF limpio.',
    category: 'convertir',
    iconName: 'globe',
    color: 'bg-cyan-600',
    href: '/url-to-pdf',
    requiresInternet: true,
    isNew: true,
  },
  {
    id: 'translate-pdf',
    name: 'Traducir PDF',
    description: 'Traduce el contenido de tu documento PDF a múltiples idiomas en línea generando un PDF maquetado o bilingüe.',
    category: 'convertir',
    iconName: 'languages',
    color: 'bg-violet-600',
    href: '/translate-pdf',
    requiresInternet: true,
    isNew: true,
  },
  {
    id: 'watermark-pdf',
    name: 'Añadir Marca de Agua',
    description: 'Estampa un texto de marca de agua diagonal sobre todas las páginas de tu PDF.',
    category: 'editar',
    iconUrl: '/icons/watermark-pdf.png',
    color: 'bg-slate-600',
    href: '/watermark-pdf',
  },
  {
    id: 'page-numbers-pdf',
    name: 'Añadir Números de Página',
    description: 'Numera automáticamente todas las páginas de tu documento PDF con formato limpio.',
    category: 'editar',
    iconUrl: '/icons/page-numbers-pdf.png',
    color: 'bg-brand',
    href: '/page-numbers-pdf',
  },
  {
    id: 'metadata-pdf',
    name: 'Editar Metadatos',
    description: 'Inspecciona, modifica o limpia las propiedades ocultas del PDF: título, autor, asunto y palabras clave.',
    category: 'editar',
    iconName: 'file-sliders',
    color: 'bg-teal-600',
    href: '/metadata-pdf',
  },
  {
    id: 'qr-pdf',
    name: 'Código QR Web en PDF',
    description: 'Estampa un código QR verificando en línea la URL destino o escanea y audita los códigos QR existentes en tu PDF.',
    category: 'editar',
    iconName: 'qr-code',
    color: 'bg-sky-600',
    href: '/qr-pdf',
    requiresInternet: true,
    isNew: true,
  },
  {
    id: 'sign-pdf',
    name: 'Firmar / Sellar PDF',
    description: 'Dibuja tu firma manuscrita en pantalla o sube la imagen de tu firma o sello corporativo para estamparla en tu PDF.',
    category: 'seguridad',
    iconName: 'pen-tool',
    color: 'bg-emerald-700',
    href: '/sign-pdf',
    isNew: true,
  },
  {
    id: 'redact-pdf',
    name: 'Censurar / Redactar PDF',
    description: 'Elimina de forma física e irreversible textos confidenciales, correos, teléfonos o identificadores en todo el PDF.',
    category: 'seguridad',
    iconName: 'eye-off',
    color: 'bg-slate-800',
    href: '/redact-pdf',
    isNew: true,
  },
  {
    id: 'protect-pdf',
    name: 'Proteger PDF',
    description: 'Cifra tu archivo PDF con contraseña estándar AES para impedir accesos no autorizados.',
    category: 'seguridad',
    iconUrl: '/icons/protect-pdf.png',
    color: 'bg-red-600',
    href: '/protect-pdf',
  },
  {
    id: 'unlock-pdf',
    name: 'Desbloquear PDF',
    description: 'Elimina la contraseña de apertura y restricciones de un archivo PDF de forma permanente.',
    category: 'seguridad',
    iconUrl: '/icons/unlock-pdf.png',
    color: 'bg-red-400',
    href: '/unlock-pdf',
  },
];
