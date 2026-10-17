'use client';

import { useMemo } from 'react';
import ToolPage from '@/components/pdf/ToolPage';
import { useSystemStore } from '@/store/useSystemStore';

const LANGUAGE_LABELS: Record<string, string> = {
  spa: 'Español (spa)',
  eng: 'Inglés (eng)',
  por: 'Portugués (por)',
  fra: 'Francés (fra)',
  deu: 'Alemán (deu)',
  ita: 'Italiano (ita)',
  cat: 'Catalán (cat)',
  glg: 'Gallego (glg)',
  eus: 'Euskera (eus)',
};

export default function OCRPDFPage() {
  const ocrLanguages = useSystemStore((s) => s.ocrLanguages);

  const languageOptions = useMemo(() => {
    const langs = ocrLanguages && ocrLanguages.length > 0 ? ocrLanguages : ['spa', 'eng'];
    return langs.map((code) => ({
      value: code,
      label: LANGUAGE_LABELS[code] ?? `Idioma (${code})`,
    }));
  }, [ocrLanguages]);

  const defaultLang = useMemo(() => {
    if (ocrLanguages.includes('spa')) return 'spa';
    return ocrLanguages[0] || 'spa';
  }, [ocrLanguages]);

  return (
    <ToolPage
      title="OCR PDF"
      description="Convierte tus PDF escaneados en documentos con texto seleccionable y buscable (OCR)."
      endpoint="/ocr/"
      buttonLabel="Aplicar OCR al PDF"
      outputExtension=".pdf"
      capabilityRequired="ocr"
      extraFields={[
        {
          key: 'language',
          label: 'Idioma del Documento',
          type: 'select',
          defaultValue: defaultLang,
          options: languageOptions,
        },
      ]}
    />
  );
}
