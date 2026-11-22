import { useSettingsStore } from '@/store/useSettingsStore';
import { es, type TranslationDictionary } from './es';
import { en } from './en';

export type { TranslationDictionary, StudioCopy, ToolCopy, ModuleCopy } from './es';

const DICTIONARIES: Record<'es' | 'en', TranslationDictionary> = {
  es,
  en,
};

export function getDictionary(locale: 'es' | 'en'): TranslationDictionary {
  return DICTIONARIES[locale] ?? es;
}

export function useI18n() {
  const locale = useSettingsStore((s) => s.locale);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const t = DICTIONARIES[locale] ?? es;

  const setLocale = (next: 'es' | 'en') => updateSetting('locale', next);
  const toggleLocale = () => updateSetting('locale', locale === 'es' ? 'en' : 'es');

  return {
    locale,
    setLocale,
    toggleLocale,
    t,
  };
}
