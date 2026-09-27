'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function PDFToWordPage() {
  return (
    <ToolPage
      title="PDF a Word"
      description="Convierte tus PDF a documentos Word (.docx) editables y fáciles de modificar."
      endpoint="/pdf-to-word/"
      buttonLabel="PDF a Word"
      outputExtension=".docx"
    />
  );
}
