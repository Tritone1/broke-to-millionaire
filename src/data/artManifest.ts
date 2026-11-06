import type { ImageSourcePropType } from 'react-native';

import { HAIRSTYLES, SKIN_TONES } from './avatarOptions';

export { HAIRSTYLES, HAIRSTYLE_INDEXES, SKIN_TONES, hairstyleIndexesForGender, normalizeHairstyleForGender, normalizeSkinTone, renderedAvatarGender } from './avatarOptions';

export type ArtLocation = 'apartment' | 'street' | 'office' | 'university' | 'bank' | 'cafe' | 'casino' | 'park' | 'hospital';
export type SceneFraming = 'full' | 'bust';
type LocationArt = { source: ImageSourcePropType; title: string; accent: string; framing: { default: SceneFraming; compact: SceneFraming } };

export const LOCATION_ART: Record<ArtLocation, LocationArt> = {
  apartment: { source: require('../../assets/game/locations/apartment.png'), title: 'Your Apartment', accent: '#F4B64A', framing: { default: 'full', compact: 'bust' } },
  street: { source: require('../../assets/game/locations/street.png'), title: 'Downtown', accent: '#55B6D7', framing: { default: 'full', compact: 'bust' } },
  office: { source: require('../../assets/game/locations/office.png'), title: 'City Office', accent: '#4E86C9', framing: { default: 'full', compact: 'bust' } },
  university: { source: require('../../assets/game/locations/university.png'), title: 'University', accent: '#9B5A3C', framing: { default: 'full', compact: 'bust' } },
  bank: { source: require('../../assets/game/locations/bank.png'), title: 'Grand Bank', accent: '#D4A62F', framing: { default: 'full', compact: 'bust' } },
  cafe: { source: require('../../assets/game/locations/cafe.png'), title: 'Corner Cafe', accent: '#64825B', framing: { default: 'full', compact: 'bust' } },
  casino: { source: require('../../assets/game/locations/casino.png'), title: 'Crown Casino', accent: '#9C2854', framing: { default: 'full', compact: 'bust' } },
  park: { source: require('../../assets/game/locations/park.png'), title: 'Central Park', accent: '#5C9C54', framing: { default: 'full', compact: 'bust' } },
  hospital: { source: require('../../assets/game/locations/hospital.png'), title: 'City Hospital', accent: '#2A9DA0', framing: { default: 'full', compact: 'bust' } },
};

export const CHARACTER_ART = {
  mentorNpc: require('../../assets/game/characters/npc_mentor.png') as ImageSourcePropType,
  portraitUnified: {
    clothing: require('../../assets/game/characters/avatar_portrait_clothing_v8.png') as ImageSourcePropType,
    necklineFront: require('../../assets/game/characters/avatar_portrait_neckline_front_v8.png') as ImageSourcePropType,
    hairBack: [
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_buzz.png'),
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_curly.png'),
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_side-sweep.png'),
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_long-waves.png'),
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_braids.png'),
      require('../../assets/game/characters/avatar_portrait_hair_back_v7_high-ponytail.png'),
    ] as ImageSourcePropType[],
    hairFront: [
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_buzz.png'),
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_curly.png'),
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_side-sweep.png'),
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_long-waves.png'),
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_braids.png'),
      require('../../assets/game/characters/avatar_portrait_hair_front_v7_high-ponytail.png'),
    ] as ImageSourcePropType[],
    headAtlases: [
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_0.png'),
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_1.png'),
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_2.png'),
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_3.png'),
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_4.png'),
      require('../../assets/game/characters/avatar_portrait_head_v8_skin_5.png'),
    ] as ImageSourcePropType[],
    neckAtlases: [
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_0.png'),
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_1.png'),
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_2.png'),
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_3.png'),
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_4.png'),
      require('../../assets/game/characters/avatar_portrait_neck_v8_skin_5.png'),
    ] as ImageSourcePropType[],
  },
  fullUnified: {
    clothing: require('../../assets/game/characters/avatar_full_clothing.png') as ImageSourcePropType,
    necklineFront: require('../../assets/game/characters/avatar_full_neckline_front.png') as ImageSourcePropType,
    hairBack: [
      require('../../assets/game/characters/avatar_full_hair_back_v4_buzz.png'),
      require('../../assets/game/characters/avatar_full_hair_back_v4_curly.png'),
      require('../../assets/game/characters/avatar_full_hair_back_v4_side-sweep.png'),
      require('../../assets/game/characters/avatar_full_hair_back_v4_long-waves.png'),
      require('../../assets/game/characters/avatar_full_hair_back_v4_braids.png'),
      require('../../assets/game/characters/avatar_full_hair_back_v4_high-ponytail.png'),
    ] as ImageSourcePropType[],
    hairFront: [
      require('../../assets/game/characters/avatar_full_hair_front_v4_buzz.png'),
      require('../../assets/game/characters/avatar_full_hair_front_v4_curly.png'),
      require('../../assets/game/characters/avatar_full_hair_front_v4_side-sweep.png'),
      require('../../assets/game/characters/avatar_full_hair_front_v4_long-waves.png'),
      require('../../assets/game/characters/avatar_full_hair_front_v4_braids.png'),
      require('../../assets/game/characters/avatar_full_hair_front_v4_high-ponytail.png'),
    ] as ImageSourcePropType[],
    headAtlases: [
      require('../../assets/game/characters/avatar_full_head_skin_0.png'),
      require('../../assets/game/characters/avatar_full_head_skin_1.png'),
      require('../../assets/game/characters/avatar_full_head_skin_2.png'),
      require('../../assets/game/characters/avatar_full_head_skin_3.png'),
      require('../../assets/game/characters/avatar_full_head_skin_4.png'),
      require('../../assets/game/characters/avatar_full_head_skin_5.png'),
    ] as ImageSourcePropType[],
    neckAtlases: [
      require('../../assets/game/characters/avatar_full_neck_skin_0.png'),
      require('../../assets/game/characters/avatar_full_neck_skin_1.png'),
      require('../../assets/game/characters/avatar_full_neck_skin_2.png'),
      require('../../assets/game/characters/avatar_full_neck_skin_3.png'),
      require('../../assets/game/characters/avatar_full_neck_skin_4.png'),
      require('../../assets/game/characters/avatar_full_neck_skin_5.png'),
    ] as ImageSourcePropType[],
  },
};

export const OUTFITS = {
  male: ['Casual', 'Student', 'Cafe', 'Office', 'Business', 'Medical', 'Luxury', 'Space'],
  female: ['Casual', 'Student', 'Cafe', 'Office', 'Business', 'Medical', 'Luxury', 'Space'],
  'non-binary': ['Casual', 'Student', 'Cafe', 'Office', 'Business', 'Medical', 'Luxury', 'Space'],
} as const;
export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'shocked'] as const;

export const CHARACTER_LAYER_ORDER = ['hairBack', 'outfitBack', 'neck', 'outfitFront', 'head', 'hairFront'] as const;
export const CHARACTER_ATLAS_ROWS = {
  hair: { source: 'hairAtlas', row: 0, variants: HAIRSTYLES.length },
  head: { source: 'headAtlases', columns: 6, genderRows: 2, skinAtlases: SKIN_TONES.length },
  body: { source: 'customizationAtlas', row: 2, variantsPerGender: OUTFITS.male.length },
  outfit: { source: 'customizationAtlas', row: 2, variantsPerGender: OUTFITS.male.length },
  face: { source: 'painted into headAtlases', variants: 6 },
} as const;

export const ART_PIPELINE = {
  locationAspectRatio: '9:16',
  transparentCharacterCanvas: '2:3',
  replaceWithoutCodeChanges: 'Keep filenames and transparent padding aligned to the manifest canvases.',
} as const;
