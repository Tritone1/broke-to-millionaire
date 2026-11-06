import { PARTNER_NAMES } from './living';

export type DatingCandidate = {
  id: string;
  name: string;
  age: number;
  gender: 'woman' | 'man' | 'non-binary';
  pronouns: 'she/her' | 'he/him' | 'they/them';
  occupation: string;
  personality: string;
  avatarEmoji: string;
  jobIncome: number;
};

const PROFILES = [
  { gender: 'woman' as const, pronouns: 'she/her' as const, avatarEmoji: '👩' },
  { gender: 'man' as const, pronouns: 'he/him' as const, avatarEmoji: '👨' },
  { gender: 'non-binary' as const, pronouns: 'they/them' as const, avatarEmoji: '🧑' },
];

const OCCUPATIONS = [
  { name: 'Cafe assistant', income: 850 },
  { name: 'Teacher', income: 1_800 },
  { name: 'Graphic designer', income: 2_300 },
  { name: 'Nurse', income: 2_700 },
  { name: 'Software developer', income: 4_200 },
  { name: 'Financial adviser', income: 4_800 },
  { name: 'Architect', income: 5_500 },
  { name: 'Small business owner', income: 6_200 },
];

const PERSONALITIES = ['Calm and thoughtful', 'Ambitious and direct', 'Funny and spontaneous', 'Creative and curious', 'Kind and family-minded', 'Adventurous and social'];

export function createDatingCandidate(seed: number, playerAge: number): DatingCandidate {
  const value = Math.abs(Math.floor(seed));
  const profile = PROFILES[value % PROFILES.length]!;
  const occupation = OCCUPATIONS[Math.floor(value / 3) % OCCUPATIONS.length]!;
  const name = PARTNER_NAMES[Math.floor(value / 7) % PARTNER_NAMES.length] ?? 'Alex';
  const personality = PERSONALITIES[Math.floor(value / 11) % PERSONALITIES.length] ?? PERSONALITIES[0]!;
  const ageOffset = (Math.floor(value / 13) % 9) - 4;
  const age = Math.max(18, Math.min(85, playerAge + ageOffset));
  return {
    id: `match-${value}`,
    name,
    age,
    gender: profile.gender,
    pronouns: profile.pronouns,
    occupation: occupation.name,
    personality,
    avatarEmoji: profile.avatarEmoji,
    jobIncome: occupation.income,
  };
}
