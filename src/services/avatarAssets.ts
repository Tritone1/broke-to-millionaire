import type { ImageSourcePropType } from 'react-native';

import { CHARACTER_ART } from '../data/artManifest';
import { normalizeHairstyleForGender, renderedAvatarGender } from '../data/avatarOptions';
import { skinToneIndex } from '../game/avatarRig';
import type { CharacterProfile } from '../store/lifeStore';
import { preloadImageSources } from './imageAssetCache';

export type AvatarAssetMode = 'portrait' | 'full';
export type AvatarAssetSet = Readonly<{
  hairBack: ImageSourcePropType;
  outfitBack: ImageSourcePropType;
  neck: ImageSourcePropType;
  outfitFront: ImageSourcePropType;
  headAndEars: ImageSourcePropType;
  hairFront: ImageSourcePropType;
}>;

export function avatarAssetSetForAppearance(genderValue: CharacterProfile['gender'], skinValue: string, hairStyle: number, mode: AvatarAssetMode): AvatarAssetSet {
  const art = mode === 'portrait' ? CHARACTER_ART.portraitUnified : CHARACTER_ART.fullUnified;
  const skin = skinToneIndex(skinValue);
  const hair = normalizeHairstyleForGender(hairStyle, renderedAvatarGender(genderValue));
  return {
    hairBack: art.hairBack[hair]!,
    outfitBack: art.clothing,
    neck: art.neckAtlases[skin] ?? art.neckAtlases[2]!,
    outfitFront: art.necklineFront,
    headAndEars: art.headAtlases[skin] ?? art.headAtlases[2]!,
    hairFront: art.hairFront[hair]!,
  };
}

export function avatarAssetSet(character: CharacterProfile, mode: AvatarAssetMode): AvatarAssetSet {
  return avatarAssetSetForAppearance(character.gender, character.avatar.skin, character.avatar.hairStyle, mode);
}

export function preloadAvatarAssetsForAppearance(gender: CharacterProfile['gender'], skin: string, hairStyle: number, mode: AvatarAssetMode): Promise<boolean[]> {
  return preloadImageSources(Object.values(avatarAssetSetForAppearance(gender, skin, hairStyle, mode)));
}

export function preloadAvatarAssets(character: CharacterProfile, mode: AvatarAssetMode): Promise<boolean[]> {
  return preloadAvatarAssetsForAppearance(character.gender, character.avatar.skin, character.avatar.hairStyle, mode);
}
