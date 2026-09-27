'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function WatermarkPDFPage() {
  return (
    <ToolPage
      title="Añadir Marca de Agua"
      description="Añade un texto de marca de agua a tu PDF."
      endpoint="/watermark/"
      buttonLabel="Añadir Marca de Agua"
      outputExtension=".pdf"
      extraFields={[
        {
          key: 'text',
          label: 'Texto de la marca',
          type: 'text',
          placeholder: 'Ej: CONFIDENCIAL',
          defaultValue: 'OpenPDF',
          required: true,
          requiredMessage: 'Introduce un texto para la marca de agua.',
        },
      ]}
    />
  );
}
