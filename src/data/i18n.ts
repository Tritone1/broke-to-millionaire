export const translations = {
  en: {
    availableCash: 'Available cash',
    perSecond: 'per sec',
    buy: 'Buy',
    owned: 'Owned',
    claim: 'Claim',
    settings: 'Settings',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)['en'];

export function translate(language: Language, key: TranslationKey): string {
  return translations[language][key] ?? translations.en[key];
}
