'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function PDFToMarkdownPage() {
  return (
    <ToolPage
      title="PDF a Markdown"
      description="Convierte tus PDF a texto estructurado en formato Markdown (.md), ideal para lectura y análisis."
      endpoint="/pdf-to-markdown/"
      buttonLabel="PDF a Markdown"
      outputExtension=".md"
    />
  );
}
