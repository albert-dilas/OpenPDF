'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function PDFToJPGPage() {
  return (
    <ToolPage
      title="PDF a JPG"
      description="Convierte cada página de tu PDF en una imagen JPG de alta calidad."
      endpoint="/pdf-to-jpg/"
      buttonLabel="PDF a JPG"
      outputExtension=".zip"
      sidebarContent={
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
          Cada página del PDF se convertirá en una imagen JPG a 300 DPI. Se descargarán todas en un archivo ZIP.
        </p>
      }
    />
  );
}
