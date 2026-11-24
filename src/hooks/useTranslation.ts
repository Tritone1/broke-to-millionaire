import { useCallback } from 'react';

import { translate, type TranslationKey } from '../data/i18n';
import { useLocalizationStore } from '../store/localizationStore';

export function useTranslation() {
  const language = useLocalizationStore((state) => state.language);
  const t = useCallback((key: TranslationKey, variables?: Record<string, string | number>) => translate(language, key, variables), [language]);
  return { language, t };
}
