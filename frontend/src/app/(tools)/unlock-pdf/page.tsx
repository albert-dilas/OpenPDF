'use client';
import ToolPage from '@/components/pdf/ToolPage';

export default function UnlockPDFPage() {
  return (
    <ToolPage
      title="Desbloquear PDF"
      description="Quita la contraseña de un archivo PDF y desbloquéalo."
      endpoint="/unlock/"
      buttonLabel="Desbloquear PDF"
      outputExtension=".pdf"
      extraFields={[
        {
          key: 'password',
          label: 'Contraseña Actual',
          type: 'password',
          placeholder: 'Contraseña de apertura',
          required: true,
          requiredMessage: 'Introduce la contraseña actual del PDF para poder desbloquearlo.',
        },
      ]}
    />
  );
}
