'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function JPGToPDFPage() {
  return (
    <ToolPage
      title="JPG a PDF"
      description="Convierte imágenes JPG a PDF. Puedes subir múltiples imágenes."
      endpoint="/jpg-to-pdf/"
      buttonLabel="JPG a PDF"
      multiple={true}
      accept=".jpg,.jpeg,.png"
      useMultipleFilesField={true}
      showImageIcon={true}
      outputExtension=".pdf"
    />
  );
}
