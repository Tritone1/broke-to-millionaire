import { LANGUAGE_OPTIONS, SUPPORTED_LANGUAGES, languageOption, translate, translations } from '../i18n';

describe('localization dictionaries', () => {
  it('provides every supported language and every English key', () => {
    const englishKeys = Object.keys(translations.en).sort();
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
    expect(LANGUAGE_OPTIONS.map((option) => option.id)).toEqual(SUPPORTED_LANGUAGES);
    for (const language of SUPPORTED_LANGUAGES) {
      expect(Object.keys(translations[language]).sort()).toEqual(englishKeys);
      expect(languageOption(language).nativeName.length).toBeGreaterThan(0);
    }
  });

  it('interpolates translated variables', () => {
    expect(translate('tr', 'deleteLifeBody', { name: 'Aylin' })).toContain('Aylin');
    expect(translate('es', 'deleteLifeBody', { name: 'Mateo' })).toContain('Mateo');
  });
});
