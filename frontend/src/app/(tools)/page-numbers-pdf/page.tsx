'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function PageNumbersPDFPage() {
  return (
    <ToolPage
      title="Añadir Números de Página"
      description="Añade números de página a tu documento PDF."
      endpoint="/page-numbers/"
      buttonLabel="Añadir Números de Página"
      outputExtension=".pdf"
    />
  );
}
