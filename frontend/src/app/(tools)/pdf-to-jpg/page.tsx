'use client';

import ToolPage from '@/components/pdf/ToolPage';

export default function PDFToJPGPage() {
  return (
    <ToolPage
      title="PDF a JPG"
      description="Convierte cada página de tu PDF en una imagen JPG de alta calidad."
      endpoint="/pdf-to-jpg/"
      buttonLabel="Convertir PDF a JPG"
      outputExtension=".zip"
      sidebarContent={
        <div className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200/70 dark:border-slate-800">
          Cada página del PDF se convertirá en una imagen JPG a <strong>300 DPI</strong> y se
          empaquetará en un archivo ZIP listo para descargar.
        </div>
      }
    />
  );
}
