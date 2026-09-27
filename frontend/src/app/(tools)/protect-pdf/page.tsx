'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function ProtectPDFPage() {
  return (
    <ToolPage
      title="Proteger PDF"
      description="Añade una contraseña para proteger tu documento."
      endpoint="/protect/"
      buttonLabel="Proteger PDF"
      outputExtension=".pdf"
      extraFields={[
        {
          key: 'password',
          label: 'Contraseña',
          type: 'password',
          placeholder: 'Escribe tu contraseña',
          required: true,
          requiredMessage: 'Debes introducir una contraseña para proteger el PDF.',
        },
      ]}
    />
  );
}
