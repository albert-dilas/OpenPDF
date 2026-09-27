'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function SplitPDFPage() {
  return (
    <ToolPage
      title="Dividir PDF"
      description="Extrae páginas o divide tu documento."
      endpoint="/split/"
      buttonLabel="Dividir PDF"
      outputExtension=".zip"
      sidebarContent={
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
          Esta herramienta extraerá <b>cada página</b> de tu PDF como un archivo independiente y te los descargará todos juntos en un archivo ZIP.
        </p>
      }
    />
  );
}
