import type { EthnicityId } from '../data/living';
import { SKIN_TONES } from '../data/avatarOptions';
import type { CharacterProfile } from '../store/lifeStore';

export const AVATAR_ATLAS = {
  ethnicityColumns: 6,
  genderRows: 2,
  hairstyleColumns: 6,
} as const;

export const ETHNICITY_COLUMNS: Record<EthnicityId, number> = {
  african: 0,
  'east-asian': 1,
  'south-asian': 2,
  european: 3,
  'middle-eastern': 4,
  'latin-american': 5,
};

export function ethnicityColumn(selected: string): number {
  return ETHNICITY_COLUMNS[selected as EthnicityId] ?? ETHNICITY_COLUMNS.european;
}

export function genderRow(gender: string): number {
  return gender === 'female' ? 1 : 0;
}

export function avatarAppearanceKey(character: Pick<CharacterProfile, 'gender' | 'ethnicity' | 'avatar'>): string {
  const avatar = character.avatar;
  return [character.gender, character.ethnicity, avatar.skin.toLowerCase(), avatar.hairStyle, avatar.hairColor.toLowerCase(), avatar.outfitColor.toLowerCase()].join(':');
}

function colorChannels(value: string): number[] {
  const normalized = value.replace('#', '');
  return normalized.length === 6
    ? [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16))
    : [0, 0, 0];
}

export function skinToneIndex(selected: string): number {
  const exact = SKIN_TONES.findIndex((tone) => tone.toLowerCase() === selected.toLowerCase());
  if (exact >= 0) return exact;

  const target = colorChannels(selected);
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  SKIN_TONES.forEach((tone, index) => {
    const candidate = colorChannels(tone);
    const distance = candidate.reduce((sum, value, channel) => sum + (value - (target[channel] ?? 0)) ** 2, 0);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}
