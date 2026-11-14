import { useCallback } from 'react';

import { translate, type TranslationKey } from '../data/i18n';
import { useSessionStore } from '../store/sessionStore';

export function useTranslation() {
  const language = useSessionStore((state) => state.settings.language);
  const t = useCallback((key: TranslationKey, variables?: Record<string, string | number>) => translate(language, key, variables), [language]);
  return { language, t };
}
