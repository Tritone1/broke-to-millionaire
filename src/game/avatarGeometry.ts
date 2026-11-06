import { AVATAR_ANCHORS, AVATAR_CANVAS, AVATAR_FRAMING, AVATAR_FULL_ANCHORS } from '../data/avatarAnchors';

export { ethnicityColumn as ethnicityFaceIndex } from './avatarRig';

export type AvatarFramingMode = 'full' | 'bust' | 'hud' | 'creator';
export type AvatarFrameGeometry = Readonly<{
  canvasWidth: number;
  canvasHeight: number;
  left: number;
  top: number;
  scale: number;
  groundY?: number;
  canvasKind: 'full' | 'portrait';
}>;

export const HUD_PORTRAIT_SCREENS = ['Home', 'Career', 'Business', 'Market', 'More'] as const;

export function avatarFrameGeometry(width: number, height: number, mode: AvatarFramingMode): AvatarFrameGeometry {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  if (mode === 'hud' || mode === 'creator') {
    const size = Math.min(safeWidth, safeHeight) * AVATAR_FRAMING.portraitCanvasRatio;
    return {
      canvasWidth: size,
      canvasHeight: size,
      left: (safeWidth - size) / 2,
      top: (safeHeight - size) / 2,
      scale: size / AVATAR_CANVAS.width,
      canvasKind: 'portrait',
    };
  }

  if (mode === 'bust') {
    const cropTop = Math.max(0, AVATAR_FULL_ANCHORS.headTop.y - (AVATAR_FULL_ANCHORS.waist.y - AVATAR_FULL_ANCHORS.headTop.y) * AVATAR_FRAMING.bustAboveHeadRatio);
    const cropHeight = AVATAR_FULL_ANCHORS.waist.y - cropTop;
    const scale = safeHeight * (1 - AVATAR_FRAMING.marginRatio * 2) / cropHeight;
    const canvasWidth = AVATAR_CANVAS.width * scale;
    return {
      canvasWidth,
      canvasHeight: AVATAR_CANVAS.fullHeight * scale,
      left: (safeWidth - canvasWidth) / 2,
      top: safeHeight * AVATAR_FRAMING.marginRatio - cropTop * scale,
      scale,
      canvasKind: 'full',
    };
  }

  const characterHeight = AVATAR_FULL_ANCHORS.groundLine.y - AVATAR_FULL_ANCHORS.headTop.y;
  const scale = safeHeight * AVATAR_FRAMING.fullCharacterHeightRatio / characterHeight;
  const groundY = safeHeight * AVATAR_FRAMING.fullGroundRatio;
  const canvasWidth = AVATAR_CANVAS.width * scale;
  return {
    canvasWidth,
    canvasHeight: AVATAR_CANVAS.fullHeight * scale,
    left: (safeWidth - canvasWidth) / 2,
    top: groundY - AVATAR_FULL_ANCHORS.groundLine.y * scale,
    scale,
    groundY,
    canvasKind: 'full',
  };
}

export function framedAnchorY(geometry: AvatarFrameGeometry, anchor: 'headTop' | 'chin' | 'feet' | 'groundLine'): number {
  const sourceY = geometry.canvasKind === 'portrait'
    ? AVATAR_ANCHORS[anchor === 'headTop' || anchor === 'chin' ? anchor : 'chin'].y
    : AVATAR_FULL_ANCHORS[anchor].y;
  return geometry.top + sourceY * geometry.scale;
}
