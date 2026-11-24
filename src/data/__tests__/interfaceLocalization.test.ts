import { localizeInterfaceText } from '../interfaceLocalization';
import { SUPPORTED_LANGUAGES } from '../i18n';

const TESTER_REPORTED_COPY = [
  'High School Diploma',
  '$50 enrollment · $0/mo',
  'Difficulty 1/5 · 3 game months · 3m at 1x',
  '✓ COMPLETED',
  'The broker is watching your progress',
  'Build capital before becoming a founder',
  'Projected total income',
  'Rent & utilities',
  'Welcome back',
  'You were away 5 sec. Income counted for 5 sec.',
  'NET RESULT · 0 MONTHS PROCESSED',
  'Offline progress stops after one game month (60 seconds).',
  'NEXT GOAL · Earn your next promotion',
  'Living · Home, food & travel',
] as const;

describe('production interface localization coverage', () => {
  it.each(SUPPORTED_LANGUAGES.filter((language) => language !== 'en'))(
    'localizes tester-reported UI in %s without an English fallback',
    (language) => {
      for (const source of TESTER_REPORTED_COPY) {
        expect(localizeInterfaceText(language, source)).not.toBe(source);
      }
    },
  );

  it('preserves formatted values while translating their labels', () => {
    expect(localizeInterfaceText('tr', 'Difficulty 2/5 · 8 game months')).toBe('Zorluk 2/5 · 8 oyun ayı');
    expect(localizeInterfaceText('de', 'You were away 5 sec.')).toContain('5 Sek.');
  });
});
