import anchorData from './avatarAnchorData.json';

export type AvatarAnchorName = keyof typeof anchorData.anchors;
export type AvatarPoint = Readonly<{ x: number; y: number }>;
export type AvatarLayerName = 'hairBack' | 'outfitBack' | 'neck' | 'outfitFront' | 'headAndEars' | 'hairFront';
export type AvatarFullAnchorName = keyof typeof anchorData.fullBodyAnchors;

export const AVATAR_CANVAS = anchorData.canvas;
export const AVATAR_ANCHORS: Readonly<Record<AvatarAnchorName, AvatarPoint>> = anchorData.anchors;
export const AVATAR_HEAD_CENTER_X = anchorData.anchors.headCenter.x;
export const AVATAR_GENDER_ANCHORS = anchorData.genderAnchors;
export const AVATAR_HEADSHOT_CROP = anchorData.headshotCrop;
export const AVATAR_CREATOR_LAYOUT = anchorData.creatorLayout;
export const AVATAR_PROPORTIONS = anchorData.proportions;
export const AVATAR_LAYER_ORDER: readonly AvatarLayerName[] = ['hairBack', 'outfitBack', 'neck', 'outfitFront', 'headAndEars', 'hairFront'];
export const AVATAR_HAIR_FITS = anchorData.hairstyles;
export const AVATAR_OUTFIT_FITS = anchorData.outfits;
export const AVATAR_FULL_ANCHORS: Readonly<Record<AvatarFullAnchorName, AvatarPoint>> = anchorData.fullBodyAnchors;
export const AVATAR_FRAMING = anchorData.framing;
export const AVATAR_REQUIRED_LAYERS: readonly AvatarLayerName[] = ['hairBack', 'outfitBack', 'neck', 'outfitFront', 'headAndEars', 'hairFront'];

export const AVATAR_OUTFIT_TOKENS = ['#087F8C', '#176B42', '#315FA8', '#7A3E9D'] as const;
export const AVATAR_HAIR_TOKENS = ['#2A1A12', '#4B2E20', '#171316', '#7A4B28'] as const;
