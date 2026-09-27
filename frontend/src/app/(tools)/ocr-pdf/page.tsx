'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function OCRPDFPage() {
  return (
    <ToolPage
      title="OCR PDF"
      description="Convierte tus PDF escaneados en documentos con texto seleccionable y buscable (OCR)."
      endpoint="/ocr/"
      buttonLabel="OCR PDF"
      outputExtension=".pdf"
      extraFields={[
        {
          key: 'language',
          label: 'Idioma del Documento',
          type: 'select',
          defaultValue: 'spa',
          options: [
            { value: 'spa', label: 'Español' },
            { value: 'eng', label: 'Inglés' },
          ],
        },
      ]}
    />
  );
}
