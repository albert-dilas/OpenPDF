import { FilePlus2, SplitSquareHorizontal, Minimize2, RefreshCcw, ShieldAlert, FileSearch, LockOpen, Type, Hash } from 'lucide-react';
import { WordIcon, JpgIcon, MarkdownIcon } from '@/components/BrandIcons';

export const tools = [
  {
    id: 'merge-pdf',
    name: 'Unir PDF',
    description: 'Une PDFs y ponlos en el orden que prefieras. ¡Rápido y fácil!',
    iconUrl: '/icons/merge-pdf.png',
    color: 'bg-brand',
    href: '/merge-pdf'
  },
  {
    id: 'split-pdf',
    name: 'Dividir PDF',
    description: 'Extrae una o varias páginas de tu PDF o convierte cada página del PDF en un archivo independiente.',
    iconUrl: '/icons/split-pdf.png',
    color: 'bg-orange-500',
    href: '/split-pdf'
  },
  {
    id: 'compress-pdf',
    name: 'Comprimir PDF',
    description: 'Consigue que tu documento PDF pese menos y, al mismo tiempo, mantener la máxima calidad posible.',
    iconUrl: '/icons/compress-pdf.png',
    color: 'bg-green-500',
    href: '/compress-pdf'
  },
  {
    id: 'pdf-to-word',
    name: 'PDF a Word',
    description: 'Convierte tus PDF a documentos Word (.docx) editables y fáciles de modificar.',
    iconUrl: '/icons/pdf-to-word.png',
    color: 'bg-blue-600',
    href: '/pdf-to-word'
  },
  {
    id: 'word-to-pdf',
    name: 'Word a PDF',
    description: 'Convierte tus documentos Word (.doc, .docx) a PDF conservando el formato original.',
    iconUrl: '/icons/word-to-pdf.png',
    color: 'bg-blue-800',
    href: '/word-to-pdf'
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Convierte tus PDF escaneados en documentos con texto seleccionable y buscable (OCR).',
    iconUrl: '/icons/ocr-pdf.png',
    color: 'bg-indigo-500',
    href: '/ocr-pdf'
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG a PDF',
    description: 'Convierte imágenes JPG a PDF. Ajusta la orientación y los márgenes.',
    iconUrl: '/icons/jpg-to-pdf.png',
    color: 'bg-yellow-400',
    href: '/jpg-to-pdf'
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF a JPG',
    description: 'Extrae todas las imágenes que están dentro de un PDF o convierte cada página en una imagen JPG.',
    iconUrl: '/icons/pdf-to-jpg.png',
    color: 'bg-yellow-500',
    href: '/pdf-to-jpg'
  },
  {
    id: 'watermark-pdf',
    name: 'Añadir Marca de Agua',
    description: 'Añade una imagen o texto de marca de agua a tu PDF.',
    iconUrl: '/icons/watermark-pdf.png',
    color: 'bg-gray-600',
    href: '/watermark-pdf'
  },
  {
    id: 'page-numbers-pdf',
    name: 'Añadir Números de Página',
    description: 'Añade números de página a tu documento PDF. Elige la posición, dimensiones y tipografía.',
    iconUrl: '/icons/page-numbers-pdf.png',
    color: 'bg-brand',
    href: '/page-numbers-pdf'
  },
  {
    id: 'unlock-pdf',
    name: 'Desbloquear PDF',
    description: 'Quita la contraseña de un archivo PDF y desbloquéalo.',
    iconUrl: '/icons/unlock-pdf.png',
    color: 'bg-red-400',
    href: '/unlock-pdf'
  },
  {
    id: 'rotate-pdf',
    name: 'Rotar PDF',
    description: 'Rota tus PDFs como quieras. Rota múltiples PDFs al mismo tiempo.',
    iconUrl: '/icons/rotate-pdf.png',
    color: 'bg-blue-400',
    href: '/rotate-pdf'
  },
  {
    id: 'protect-pdf',
    name: 'Proteger PDF',
    description: 'Protege archivos PDF con contraseña. Encripta documentos PDF para evitar accesos no autorizados.',
    iconUrl: '/icons/protect-pdf.png',
    color: 'bg-red-600',
    href: '/protect-pdf'
  },
  {
    id: 'pdf-to-markdown',
    name: 'PDF a Markdown',
    description: 'Convierte tus PDF a texto estructurado en formato Markdown (.md), ideal para RAG y LLMs.',
    iconUrl: '/icons/pdf-to-markdown.png',
    color: 'bg-indigo-600',
    href: '/pdf-to-markdown'
  }
];
