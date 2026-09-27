'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function WordToPDFPage() {
  return (
    <ToolPage
      title="Word a PDF"
      description="Convierte tus documentos Word (.doc, .docx) a PDF conservando el formato original."
      endpoint="/word-to-pdf/"
      buttonLabel="Word a PDF"
      accept=".doc,.docx"
      outputExtension=".pdf"
    />
  );
}
