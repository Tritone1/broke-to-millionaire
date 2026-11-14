import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { CHARACTER_ART, HAIRSTYLES, normalizeHairstyleForGender } from '../data/artManifest';
import { AVATAR_ANCHORS, AVATAR_CANVAS, AVATAR_FULL_ANCHORS, type AvatarLayerName } from '../data/avatarAnchors';
import { AVATAR_REQUIRED_LAYERS } from '../data/avatarAnchors';
import { atomicAssetSetReady, emptyAtomicAssetState, updateAtomicAssetState } from '../game/atomicAssetSet';
import { AVATAR_ATLAS, avatarAppearanceKey, ethnicityColumn, genderRow, skinToneIndex } from '../game/avatarRig';
import { avatarAssetSetForAppearance, preloadAvatarAssetsForAppearance } from '../services/avatarAssets';
import { imageSourceKey, markImageSourceDecoded, preloadImageSource } from '../services/imageAssetCache';
import type { CharacterProfile } from '../store/lifeStore';

type UnifiedArt = Pick<typeof CHARACTER_ART.portraitUnified, 'clothing' | 'necklineFront' | 'hairBack' | 'hairFront' | 'headAtlases' | 'neckAtlases'>;
type CharacterRenderMode = 'portrait' | 'preview' | 'scene' | 'full-body';

const AtlasLayer = memo(function AtlasLayer({ source, columns, rows, column, row, colorToken, tokenOpacity = 0, debugTint, layerName, fallbackSource, fallbackColumn = column, fallbackRow = row, onReady, onFailure }: {
  source: ImageSourcePropType;
  columns: number;
  rows: number;
  column: number;
  row: number;
  colorToken?: string;
  tokenOpacity?: number;
  debugTint?: string;
  layerName: AvatarLayerName;
  fallbackSource?: ImageSourcePropType;
  fallbackColumn?: number;
  fallbackRow?: number;
  onReady: (layer: AvatarLayerName, source: ImageSourcePropType) => void;
  onFailure: (layer: AvatarLayerName) => void;
}) {
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | null>(null);
  const failed = failedSource === source;
  const activeSource = failed && fallbackSource ? fallbackSource : source;
  const activeColumn = failed ? fallbackColumn : column;
  const activeRow = failed ? fallbackRow : row;
  const imageStyle = {
    position: 'absolute' as const,
    width: `${columns * 100}%` as const,
    height: `${rows * 100}%` as const,
    left: `${-activeColumn * 100}%` as const,
    top: `${-activeRow * 100}%` as const,
  };
  const reportError = () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[Avatar] Failed to load ${layerName}; using the default matching avatar layer.`);
    }
    if (fallbackSource && !failed) setFailedSource(source);
    else onFailure(layerName);
  };
  return (
    <View pointerEvents="none" style={styles.layerCanvas}>
      <Image source={activeSource} resizeMode="contain" resizeMethod="scale" fadeDuration={0} onLoad={() => onReady(layerName, activeSource)} onError={reportError} style={[imageStyle, debugTint ? { tintColor: debugTint } : null]} />
      {!debugTint && colorToken && tokenOpacity > 0 ? <Image source={activeSource} resizeMode="contain" resizeMethod="scale" fadeDuration={0} style={[imageStyle, { tintColor: colorToken, opacity: tokenOpacity }]} /> : null}
    </View>
  );
});

const CanvasLayer = memo(function CanvasLayer({ source, colorToken, tokenOpacity = 0, debugTint, layerName, onReady, onFailure }: {
  source: ImageSourcePropType;
  colorToken?: string;
  tokenOpacity?: number;
  debugTint?: string;
  layerName: AvatarLayerName;
  onReady: (layer: AvatarLayerName, source: ImageSourcePropType) => void;
  onFailure: (layer: AvatarLayerName) => void;
}) {
  const reportError = () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[Avatar] Failed to load ${layerName}; hiding only that full-canvas layer.`);
    }
    onFailure(layerName);
  };
  return (
    <View pointerEvents="none" style={styles.fullLayerCanvas}>
      <Image source={source} resizeMode="contain" resizeMethod="scale" fadeDuration={0} onLoad={() => onReady(layerName, source)} onError={reportError} style={[styles.canvasImage, debugTint ? { tintColor: debugTint } : null]} />
      {!debugTint && colorToken && tokenOpacity > 0 ? <Image source={source} resizeMode="contain" resizeMethod="scale" fadeDuration={0} style={[styles.canvasImage, { tintColor: colorToken, opacity: tokenOpacity }]} /> : null}
    </View>
  );
});

export function AvatarDebugOverlay({ portrait = true }: { portrait?: boolean }) {
  const anchorMap = portrait ? AVATAR_ANCHORS : AVATAR_FULL_ANCHORS;
  const anchors = Object.values(anchorMap);
  const canvasHeight = portrait ? AVATAR_CANVAS.portraitHeight : AVATAR_CANVAS.fullHeight;
  const grid = Array.from({ length: 9 }, (_, index) => (index + 1) * (AVATAR_CANVAS.width / 10));
  const horizontalGrid = Array.from({ length: Math.floor(canvasHeight / 64) }, (_, index) => (index + 1) * 64);
  return (
    <Svg pointerEvents="none" style={styles.debugOverlay} viewBox={`0 0 ${AVATAR_CANVAS.width} ${canvasHeight}`}>
      <Rect x={0} y={0} width={AVATAR_CANVAS.width} height={canvasHeight} fill="none" stroke="#FFFFFF" strokeWidth={2} />
      {grid.map((position) => <Line key={`v-${position}`} x1={position} y1={0} x2={position} y2={canvasHeight} stroke="#FFFFFF55" strokeWidth={1} />)}
      {horizontalGrid.map((position) => <Line key={`h-${position}`} x1={0} y1={position} x2={AVATAR_CANVAS.width} y2={position} stroke="#FFFFFF55" strokeWidth={1} />)}
      <Line x1={0} y1={anchorMap.eyeLine.y} x2={AVATAR_CANVAS.width} y2={anchorMap.eyeLine.y} stroke="#00E5FF" strokeWidth={2} />
      <Line x1={anchorMap.headTop.x} y1={anchorMap.headTop.y} x2={anchorMap.chin.x} y2={anchorMap.neckBase.y} stroke="#FFD447" strokeWidth={2} />
      <Line x1={0} y1={portrait ? AVATAR_ANCHORS.shoulderLine.y : AVATAR_FULL_ANCHORS.groundLine.y} x2={AVATAR_CANVAS.width} y2={portrait ? AVATAR_ANCHORS.shoulderLine.y : AVATAR_FULL_ANCHORS.groundLine.y} stroke="#7CFF6B" strokeWidth={2} />
      {anchors.map((anchor, index) => <Circle key={`${anchor.x}-${anchor.y}-${index}`} cx={anchor.x} cy={anchor.y} r={6} fill="#FF4F87" stroke="#FFFFFF" strokeWidth={2} />)}
    </Svg>
  );
}

const UnifiedLayers = memo(function UnifiedLayers({ character, art, portrait, debugLayers, showAnchors, onLayerReady, onLayerFailure }: { character: CharacterProfile; art: UnifiedArt; portrait: boolean; debugLayers: boolean; showAnchors: boolean; onLayerReady: (layer: AvatarLayerName, source: ImageSourcePropType) => void; onLayerFailure: (layer: AvatarLayerName) => void }) {
  const skinIndex = skinToneIndex(character.avatar.skin);
  const renderGender = character.gender === 'female' ? 'female' : 'male';
  const hairIndex = normalizeHairstyleForGender(character.avatar.hairStyle, renderGender);
  const gender = genderRow(character.gender);
  const ethnicity = ethnicityColumn(character.ethnicity);
  const hairTintOpacity = character.avatar.hairColor.toLowerCase() === '#2a1a12' ? 0 : 0.16;
  const outfitTintOpacity = character.avatar.outfitColor.toLowerCase() === '#176b42' ? 0 : 0.12;
  const hairBack = art.hairBack[hairIndex]!;
  const headAndEars = art.headAtlases[skinIndex] ?? art.headAtlases[2]!;
  const neck = art.neckAtlases[skinIndex] ?? art.neckAtlases[2]!;
  const outfitBack = art.clothing;
  const outfitFront = art.necklineFront;
  const hairFront = art.hairFront[hairIndex]!;
  return (
    <>
      <CanvasLayer key={`hair-back-${imageSourceKey(hairBack)}`} layerName="hairBack" source={hairBack} colorToken={character.avatar.hairColor} tokenOpacity={hairTintOpacity} debugTint={debugLayers ? '#2563EB' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      <AtlasLayer key={`outfit-back-${imageSourceKey(outfitBack)}`} layerName="outfitBack" source={outfitBack} columns={2} rows={1} column={gender} row={0} colorToken={character.avatar.outfitColor} tokenOpacity={outfitTintOpacity} debugTint={debugLayers ? '#22C55E' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      <AtlasLayer key={`neck-${imageSourceKey(neck)}`} layerName="neck" source={neck} fallbackSource={art.neckAtlases[2]} fallbackColumn={ethnicityColumn('european')} fallbackRow={gender} columns={AVATAR_ATLAS.ethnicityColumns} rows={2} column={ethnicity} row={gender} debugTint={debugLayers ? '#FACC15' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      <AtlasLayer key={`outfit-front-${imageSourceKey(outfitFront)}`} layerName="outfitFront" source={outfitFront} columns={2} rows={1} column={gender} row={0} debugTint={debugLayers ? '#EC4899' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      <AtlasLayer key={`head-${imageSourceKey(headAndEars)}`} layerName="headAndEars" source={headAndEars} fallbackSource={art.headAtlases[2]} fallbackColumn={ethnicityColumn('european')} fallbackRow={gender} columns={AVATAR_ATLAS.ethnicityColumns} rows={2} column={ethnicity} row={gender} debugTint={debugLayers ? '#F97316' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      <CanvasLayer key={`hair-front-${imageSourceKey(hairFront)}`} layerName="hairFront" source={hairFront} colorToken={character.avatar.hairColor} tokenOpacity={hairTintOpacity} debugTint={debugLayers ? '#A855F7' : undefined} onReady={onLayerReady} onFailure={onLayerFailure} />
      {showAnchors ? <AvatarDebugOverlay portrait={portrait} /> : null}
    </>
  );
});

export function CharacterHead({ character, style, portraitCrop = 'expanded' }: {
  character: CharacterProfile;
  style?: StyleProp<ViewStyle>;
  portraitCrop?: 'expanded' | 'tight';
}) {
  return <PlayerCharacter character={character} mode="portrait" portraitCrop={portraitCrop} style={style} />;
}

export const PlayerCharacter = memo(function PlayerCharacter({ character, style, mode = 'full-body', portraitCrop = 'expanded', debugLayers = false, showAnchors = false }: {
  character: CharacterProfile;
  style?: StyleProp<ViewStyle>;
  mode?: CharacterRenderMode;
  portraitCrop?: 'expanded' | 'tight';
  debugLayers?: boolean;
  showAnchors?: boolean;
}) {
  const female = character.gender === 'female';
  const portrait = mode === 'portrait';
  const assetGender = character.gender;
  const assetSkin = character.avatar.skin;
  const hairIndex = normalizeHairstyleForGender(character.avatar.hairStyle, character.gender);
  const sources = useMemo(() => avatarAssetSetForAppearance(assetGender, assetSkin, hairIndex, portrait ? 'portrait' : 'full'), [assetGender, assetSkin, hairIndex, portrait]);
  const appearance = avatarAppearanceKey(character);
  const signature = useMemo(() => `${portrait ? 'portrait' : 'full'}:${appearance}:${AVATAR_REQUIRED_LAYERS.map((layer) => `${layer}=${imageSourceKey(sources[layer])}`).join('|')}`, [appearance, portrait, sources]);
  const [assetState, setAssetState] = useState(() => emptyAtomicAssetState(signature));
  const layerReady = useCallback((layer: AvatarLayerName, source: ImageSourcePropType) => {
    markImageSourceDecoded(source);
    setAssetState((current) => updateAtomicAssetState(current, signature, layer, 'ready'));
  }, [signature]);
  const layerFailed = useCallback((layer: AvatarLayerName) => {
    setAssetState((current) => updateAtomicAssetState(current, signature, layer, 'failed'));
  }, [signature]);
  useEffect(() => {
    let active = true;
    for (const layer of AVATAR_REQUIRED_LAYERS) {
      const source = sources[layer];
      void preloadImageSource(source).then((loaded) => {
        if (active && loaded) layerReady(layer, source);
      });
    }
    if (portrait) void preloadAvatarAssetsForAppearance(assetGender, assetSkin, hairIndex, 'full');
    return () => { active = false; };
  }, [assetGender, assetSkin, hairIndex, layerReady, portrait, sources]);
  const ready = atomicAssetSetReady(assetState, signature, AVATAR_REQUIRED_LAYERS);
  return (
    <View accessibilityLabel={`${character.name}, ${female ? 'female' : 'male'}, ${HAIRSTYLES[hairIndex]}`} accessibilityState={{ busy: !ready }} style={[styles.character, style]}>
      <View style={portrait ? (portraitCrop === 'tight' ? styles.portraitCanvasTight : styles.portraitCanvas) : styles.fullCanvas}>
        <View testID="avatar-complete-layers" pointerEvents="none" style={StyleSheet.absoluteFill}>
          <UnifiedLayers key={signature} character={character} art={portrait ? CHARACTER_ART.portraitUnified : CHARACTER_ART.fullUnified} portrait={portrait} debugLayers={debugLayers} showAnchors={showAnchors} onLayerReady={layerReady} onLayerFailure={layerFailed} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  character: { position: 'relative', overflow: 'visible' },
  portraitCanvas: { position: 'absolute', width: '111%', height: '100%', left: '-5.5%', bottom: 0, overflow: 'visible' },
  portraitCanvasTight: { position: 'absolute', width: '100%', height: '100%', left: 0, bottom: 0, overflow: 'visible' },
  fullCanvas: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'visible' },
  layerCanvas: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  fullLayerCanvas: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'visible' },
  canvasImage: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  debugOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
});
