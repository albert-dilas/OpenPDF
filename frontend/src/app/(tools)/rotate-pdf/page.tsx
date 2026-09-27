'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function RotatePDFPage() {
  return (
    <ToolPage
      title="Rotar PDF"
      description="Gira las páginas de tu PDF al instante."
      endpoint="/rotate/"
      buttonLabel="Rotar PDF"
      outputExtension=".pdf"
      extraFields={[
        {
          key: 'degrees',
          label: 'Rotación',
          type: 'select',
          defaultValue: '90',
          options: [
            { value: '90', label: 'Derecha (90°)' },
            { value: '180', label: 'Al revés (180°)' },
            { value: '-90', label: 'Izquierda (-90°)' },
          ],
        },
      ]}
    />
  );
}
