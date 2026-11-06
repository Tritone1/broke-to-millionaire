import skinToneTokens from './avatarSkinTones.json';

export type RenderedAvatarGender = 'male' | 'female';

export const SKIN_TONES = skinToneTokens as unknown as readonly [string, string, string, string, string, string];
export const HAIRSTYLES = ['Buzz cut', 'Curly crop', 'Side sweep', 'Long waves', 'Braids', 'Pixie sweep'] as const;
export const HAIRSTYLE_INDEXES = {
  male: [0, 1, 2],
  female: [3, 4, 5],
} as const;

export function renderedAvatarGender(gender: string): RenderedAvatarGender {
  return gender === 'female' ? 'female' : 'male';
}

export function hairstyleIndexesForGender(gender: string): readonly number[] {
  return HAIRSTYLE_INDEXES[renderedAvatarGender(gender)];
}

export function normalizeHairstyleForGender(hairStyle: number, gender: string): number {
  const available = hairstyleIndexesForGender(gender);
  const normalized = Math.max(0, Math.min(HAIRSTYLES.length - 1, Math.round(hairStyle)));
  return available.some((index) => index === normalized) ? normalized : available[0]!;
}

export function normalizeSkinTone(skin: string): string {
  return SKIN_TONES.some((tone) => tone.toLowerCase() === skin.toLowerCase()) ? skin : SKIN_TONES[2];
}
