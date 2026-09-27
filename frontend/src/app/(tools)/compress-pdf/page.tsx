'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function CompressPDFPage() {
  return (
    <ToolPage
      title="Comprimir PDF"
      description="Consigue que tu documento pese menos manteniendo calidad."
      endpoint="/compress/"
      buttonLabel="Comprimir PDF"
      outputExtension=".pdf"
      sidebarContent={
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
          Esta herramienta aplicará compresión avanzada para reducir el tamaño del archivo de forma óptima sin perder calidad visual importante.
        </p>
      }
    />
  );
}
