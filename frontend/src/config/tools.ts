export type ToolCategory =
  | 'organizar'
  | 'optimizar'
  | 'convertir'
  | 'editar'
  | 'seguridad';

export type ToolIconName =
  | 'combine'
  | 'scissors'
  | 'layout-grid'
  | 'rotate-cw'
  | 'file-down'
  | 'scan-text'
  | 'file-text'
  | 'file-output'
  | 'image-plus'
  | 'images'
  | 'file-code-2'
  | 'globe'
  | 'languages'
  | 'stamp'
  | 'hash'
  | 'sliders-horizontal'
  | 'file-sliders'
  | 'qr-code'
  | 'pen-tool'
  | 'eye-off'
  | 'lock'
  | 'unlock';

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconUrl?: string;
  iconName: ToolIconName;
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
    iconName: 'combine',
    color: 'bg-gradient-to-br from-brand to-rose-700',
    href: '/merge-pdf',
  },
  {
    id: 'split-pdf',
    name: 'Dividir PDF',
    description: 'Extrae páginas específicas por rangos o convierte cada página en un archivo independiente.',
    category: 'organizar',
    iconName: 'scissors',
    color: 'bg-gradient-to-br from-orange-500 to-amber-600',
    href: '/split-pdf',
  },
  {
    id: 'organize-pdf',
    name: 'Organizar PDF',
    description: 'Previsualiza miniaturas, reordena arrastrando, rota páginas individuales o elimina las que no necesites.',
    category: 'organizar',
    iconName: 'layout-grid',
    color: 'bg-gradient-to-br from-rose-500 to-red-700',
    href: '/organize-pdf',
  },
  {
    id: 'rotate-pdf',
    name: 'Rotar PDF',
    description: 'Gira todas las páginas de tu documento PDF 90°, 180° o -90° al instante.',
    category: 'organizar',
    iconName: 'rotate-cw',
    color: 'bg-gradient-to-br from-sky-500 to-blue-600',
    href: '/rotate-pdf',
  },
  {
    id: 'compress-pdf',
    name: 'Comprimir PDF',
    description: 'Reduce el peso de tu PDF eligiendo entre compresión rápida, equilibrada o máxima con optimización de imágenes.',
    category: 'optimizar',
    iconName: 'file-down',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-700',
    href: '/compress-pdf',
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Reconoce texto en documentos escaneados para hacerlos seleccionables y buscables.',
    category: 'optimizar',
    iconName: 'scan-text',
    color: 'bg-gradient-to-br from-indigo-500 to-violet-700',
    href: '/ocr-pdf',
    requiredCapability: 'ocr',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF a Word',
    description: 'Convierte tus PDF a documentos Word (.docx) editables conservando la estructura.',
    category: 'convertir',
    iconName: 'file-text',
    color: 'bg-gradient-to-br from-blue-500 to-indigo-700',
    href: '/pdf-to-word',
  },
  {
    id: 'word-to-pdf',
    name: 'Word a PDF',
    description: 'Convierte documentos Word (.doc, .docx) a PDF conservando el diseño original.',
    category: 'convertir',
    iconName: 'file-output',
    color: 'bg-gradient-to-br from-blue-600 to-slate-800',
    href: '/word-to-pdf',
    requiredCapability: 'word_to_pdf',
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG a PDF',
    description: 'Convierte una o múltiples imágenes JPG y PNG en un único documento PDF.',
    category: 'convertir',
    iconName: 'image-plus',
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    href: '/jpg-to-pdf',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF a JPG',
    description: 'Exporta cada página de tu documento PDF como imagen JPG de alta resolución (300 DPI).',
    category: 'convertir',
    iconName: 'images',
    color: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    href: '/pdf-to-jpg',
  },
  {
    id: 'pdf-to-markdown',
    name: 'PDF a Markdown',
    description: 'Extrae el contenido de tu PDF a texto estructurado en Markdown (.md), ideal para notas y LLMs.',
    category: 'convertir',
    iconName: 'file-code-2',
    color: 'bg-gradient-to-br from-indigo-600 to-purple-700',
    href: '/pdf-to-markdown',
  },
  {
    id: 'url-to-pdf',
    name: 'Web / URL a PDF',
    description: 'Captura y convierte cualquier página web pública, artículo o documentación en línea a un documento PDF limpio.',
    category: 'convertir',
    iconName: 'globe',
    color: 'bg-gradient-to-br from-cyan-500 to-teal-700',
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
    color: 'bg-gradient-to-br from-violet-500 to-fuchsia-700',
    href: '/translate-pdf',
    requiresInternet: true,
    isNew: true,
  },
  {
    id: 'watermark-pdf',
    name: 'Añadir Marca de Agua',
    description: 'Estampa un texto de marca de agua diagonal sobre todas las páginas de tu PDF.',
    category: 'editar',
    iconName: 'stamp',
    color: 'bg-gradient-to-br from-slate-600 to-slate-800',
    href: '/watermark-pdf',
  },
  {
    id: 'page-numbers-pdf',
    name: 'Añadir Números de Página',
    description: 'Numera automáticamente todas las páginas de tu documento PDF con formato limpio.',
    category: 'editar',
    iconName: 'hash',
    color: 'bg-gradient-to-br from-brand to-red-700',
    href: '/page-numbers-pdf',
  },
  {
    id: 'metadata-pdf',
    name: 'Editar Metadatos',
    description: 'Inspecciona, modifica o limpia las propiedades ocultas del PDF: título, autor, asunto y palabras clave.',
    category: 'editar',
    iconName: 'sliders-horizontal',
    color: 'bg-gradient-to-br from-teal-500 to-emerald-700',
    href: '/metadata-pdf',
  },
  {
    id: 'qr-pdf',
    name: 'Código QR Web en PDF',
    description: 'Estampa un código QR verificando en línea la URL destino o escanea y audita los códigos QR existentes en tu PDF.',
    category: 'editar',
    iconName: 'qr-code',
    color: 'bg-gradient-to-br from-sky-500 to-indigo-700',
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
    color: 'bg-gradient-to-br from-emerald-600 to-green-800',
    href: '/sign-pdf',
    isNew: true,
  },
  {
    id: 'redact-pdf',
    name: 'Censurar / Redactar PDF',
    description: 'Elimina de forma física e irreversible textos confidenciales, correos, teléfonos o identificadores en todo el PDF.',
    category: 'seguridad',
    iconName: 'eye-off',
    color: 'bg-gradient-to-br from-slate-700 to-slate-950',
    href: '/redact-pdf',
    isNew: true,
  },
  {
    id: 'protect-pdf',
    name: 'Proteger PDF',
    description: 'Cifra tu archivo PDF con contraseña estándar AES para impedir accesos no autorizados.',
    category: 'seguridad',
    iconName: 'lock',
    color: 'bg-gradient-to-br from-red-600 to-rose-800',
    href: '/protect-pdf',
  },
  {
    id: 'unlock-pdf',
    name: 'Desbloquear PDF',
    description: 'Elimina la contraseña de apertura y restricciones de un archivo PDF de forma permanente.',
    category: 'seguridad',
    iconName: 'unlock',
    color: 'bg-gradient-to-br from-rose-500 to-orange-600',
    href: '/unlock-pdf',
  },
];
