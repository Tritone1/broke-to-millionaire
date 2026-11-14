import { useState } from 'react';

import { LanguagePickerBody } from '../components/LanguagePicker';
import type { Language } from '../data/i18n';
import { useSessionStore } from '../store/sessionStore';

export function LanguageSelectionScreen() {
  const savedLanguage = useSessionStore((state) => state.settings.language);
  const chooseLanguage = useSessionStore((state) => state.chooseLanguage);
  const [selected, setSelected] = useState<Language>(savedLanguage);
  return <LanguagePickerBody selected={selected} onSelect={setSelected} onConfirm={() => void chooseLanguage(selected)} />;
}
