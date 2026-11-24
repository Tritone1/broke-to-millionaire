import { create } from 'zustand';
import type { Language } from '../data/i18n';

type LocalizationState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

/** Lightweight UI language state; persistence remains owned by sessionStore. */
export const useLocalizationStore = create<LocalizationState>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
}));
