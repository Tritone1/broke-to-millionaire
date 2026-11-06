import { memo, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { CHARACTER_ART, LOCATION_ART, type ArtLocation, type SceneFraming } from '../../data/artManifest';
import { avatarFrameGeometry } from '../../game/avatarGeometry';
import { imageSourceKey, markImageSourceDecoded, preloadImageSource } from '../../services/imageAssetCache';
import { useLifeStore, type CharacterProfile } from '../../store/lifeStore';
import { PlayerCharacter } from '../PlayerCharacter';
export type CharacterPose = 'idle' | 'talk' | 'walk' | 'celebrate' | 'sad' | 'hurt';

export type SceneLocation = ArtLocation | 'home' | 'motel';
export type SceneAction = {
  id: string;
  icon: string;
  label: string;
  hint?: string;
  onPress: () => void;
  position: 'left' | 'right' | 'door';
  highlighted?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function artLocation(location: SceneLocation): ArtLocation {
  if (location === 'home' || location === 'motel') return 'apartment';
  return location;
}

function ActionBubble({ action }: { action: SceneAction }) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (action.highlighted) pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [action.highlighted, pulse]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (1 + pulse.value * 0.045) }],
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.actionBubble, styles[action.position], action.highlighted && styles.actionHighlighted, animatedStyle]}
    >
      <Text style={styles.actionIcon}>{action.icon}</Text>
      <View style={styles.actionCopy}>
        <Text style={styles.actionLabel}>{action.label}</Text>
        {action.hint ? <Text style={styles.actionHint}>{action.hint}</Text> : null}
      </View>
    </AnimatedPressable>
  );
}

function CharacterSprite({ source, character, pose, npc = false, sceneWidth, sceneHeight, framing = 'full', debugLayers = false, showAnchors = false }: { source?: ImageSourcePropType; character?: CharacterProfile; pose: CharacterPose; npc?: boolean; sceneWidth: number; sceneHeight: number; framing?: SceneFraming; debugLayers?: boolean; showAnchors?: boolean }) {
  const breath = useSharedValue(0);
  const walk = useSharedValue(-70);
  const talk = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(withTiming(1, { duration: 1_650, easing: Easing.inOut(Easing.ease) }), -1, true);
    walk.value = withSpring(0, { damping: 14, stiffness: 90 });
    if (pose === 'talk') talk.value = withRepeat(withSequence(withTiming(1, { duration: 180 }), withTiming(0, { duration: 180 })), -1, false);
    else talk.value = withTiming(0);
  }, [breath, pose, talk, walk]);
  const geometry = avatarFrameGeometry(sceneWidth, sceneHeight, framing);
  const style = useAnimatedStyle(() => {
    const reaction = pose === 'celebrate' ? -10 : pose === 'hurt' ? 8 : pose === 'sad' ? 5 : 0;
    const rotate = pose === 'hurt' ? '-4deg' : pose === 'celebrate' ? '2deg' : '0deg';
    const scaleY = interpolate(breath.value, [0, 1], [1, 0.994]);
    const feetCorrection = geometry.canvasHeight * (1 - scaleY) / 2;
    return {
      transform: [
        { translateX: npc ? 0 : walk.value },
        { translateY: reaction + talk.value * 2 + feetCorrection },
        { scaleX: interpolate(breath.value, [0, 1], [1, 1.012]) },
        { scaleY },
        { rotate },
      ],
    };
  });
  if (npc) return <Animated.View style={[styles.npc, style]}>{source ? <Image source={source} resizeMode="contain" style={styles.characterImage} /> : null}</Animated.View>;
  return (
    <>
      {framing === 'full' ? <Animated.View pointerEvents="none" style={[styles.contactShadow, { left: geometry.left + geometry.canvasWidth * 0.23, top: (geometry.groundY ?? sceneHeight * 0.93) - 3, width: geometry.canvasWidth * 0.54, height: Math.max(6, geometry.canvasWidth * 0.075) }]} /> : null}
      <Animated.View style={[styles.player, { left: geometry.left, top: geometry.top, width: geometry.canvasWidth, height: geometry.canvasHeight }, style]}>
        {character ? <PlayerCharacter character={character} mode="full-body" debugLayers={debugLayers} showAnchors={showAnchors} style={styles.characterImage} /> : null}
      </Animated.View>
    </>
  );
}

export function AvatarFramePreview({ character, width, height, framing, debugLayers = false, showAnchors = false }: { character: CharacterProfile; width: number; height: number; framing: SceneFraming; debugLayers?: boolean; showAnchors?: boolean }) {
  return (
    <View style={[styles.previewFrame, { width, height }]}>
      <CharacterSprite character={character} pose="idle" sceneWidth={width} sceneHeight={height} framing={framing} debugLayers={debugLayers} showAnchors={showAnchors} />
    </View>
  );
}

export const SceneStage = memo(function SceneStage({
  location,
  pose = 'idle',
  compact = false,
  hero = false,
  crowd = false,
  eventNpc = false,
  actions = [],
  style,
  framing,
}: {
  location: SceneLocation;
  pose?: CharacterPose;
  compact?: boolean;
  hero?: boolean;
  crowd?: boolean;
  eventNpc?: boolean;
  actions?: SceneAction[];
  style?: ViewStyle;
  framing?: SceneFraming;
}) {
  const month = useLifeStore((state) => state.gameMonth);
  const character = useLifeStore((state) => state.character);
  const isNight = useLifeStore((state) => state.monthProgressSeconds < state.monthLengthSeconds * 0.14 || state.monthProgressSeconds > state.monthLengthSeconds * 0.82);
  const drift = useSharedValue(0);
  const glow = useSharedValue(0);
  const [stageSize, setStageSize] = useState({ width: 390, height: compact ? 190 : 520 });
  const selected = LOCATION_ART[artLocation(location)];
  const backgroundKey = imageSourceKey(selected.source);
  const [backgroundState, setBackgroundState] = useState({ key: backgroundKey, ready: false, failed: false });
  const selectedFraming = framing ?? (compact ? selected.framing.compact : selected.framing.default);
  const measureStage = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setStageSize((current) => current.width === width && current.height === height ? current : { width, height });
  };
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 12_000, easing: Easing.inOut(Easing.ease) }), -1, true);
    glow.value = withRepeat(withTiming(1, { duration: 3_200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [drift, glow]);
  useEffect(() => {
    void preloadImageSource(selected.source);
  }, [backgroundKey, selected.source]);
  const backgroundStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1.07 }, { translateX: interpolate(drift.value, [0, 1], [-3, 3]) }] }));
  const foregroundStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(drift.value, [0, 1], [4, -4]) }, { translateY: interpolate(glow.value, [0, 1], [0, -3]) }] }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: interpolate(glow.value, [0, 1], [0.08, 0.18]) }));
  const season = ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor((month % 12) / 3)] ?? 'Spring';
  return (
    <View onLayout={measureStage} style={[styles.stage, compact && styles.compact, hero && styles.hero, style]}>
      <View testID={backgroundState.key === backgroundKey && backgroundState.failed ? 'scene-background-failed' : 'scene-background-loading'} pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scenePlaceholder]}><View style={styles.placeholderSky} /><View style={styles.placeholderHorizon} /><View style={styles.placeholderGround} /></View>
      <Animated.Image
        source={selected.source}
        resizeMode="cover"
        onLoad={() => {
          markImageSourceDecoded(selected.source);
          setBackgroundState({ key: backgroundKey, ready: true, failed: false });
        }}
        onError={() => setBackgroundState({ key: backgroundKey, ready: false, failed: true })}
        style={[StyleSheet.absoluteFill, styles.background, backgroundStyle]}
      />
      <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.sunGlow, lightStyle]} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, isNight && styles.night]} />
        <View style={styles.locationPill}>
          <Text style={styles.locationText}>{selected.title}</Text>
          <Text style={styles.timeText}>{isNight ? 'Night' : 'Day'} · {season}</Text>
        </View>
        {eventNpc || crowd ? <CharacterSprite source={CHARACTER_ART.mentorNpc} pose="talk" npc sceneWidth={stageSize.width} sceneHeight={stageSize.height} /> : null}
        <CharacterSprite character={character} pose={pose} sceneWidth={stageSize.width} sceneHeight={stageSize.height} framing={selectedFraming} />
        {actions.map((action) => <ActionBubble key={action.id} action={action} />)}
        <Animated.View pointerEvents="none" style={[styles.foreground, foregroundStyle]}>
          <Text style={styles.foregroundLeaf}>✦</Text>
          <Text style={styles.foregroundLeafSmall}>•</Text>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  stage: { height: 286, overflow: 'hidden', backgroundColor: '#75BFE0', borderRadius: 0 },
  compact: { height: 190, borderBottomWidth: 3, borderBottomColor: '#17364C' },
  hero: { flex: 1, height: undefined, minHeight: 360 },
  background: { width: '100%', height: '100%' },
  scenePlaceholder: { overflow: 'hidden', backgroundColor: '#9BD5E8' },
  placeholderSky: { position: 'absolute', left: 0, right: 0, top: 0, height: '58%', backgroundColor: '#9BD5E8' },
  placeholderHorizon: { position: 'absolute', left: '-5%', right: '-5%', top: '42%', height: '30%', borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: '#6FAE8B' },
  placeholderGround: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: '#C8A77D' },
  sunGlow: { backgroundColor: '#FFD98A' },
  night: { backgroundColor: 'rgba(17,31,69,0.42)' },
  locationPill: { position: 'absolute', top: 10, left: 10, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(16,35,49,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', zIndex: 8 },
  locationText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  timeText: { color: '#FFE283', fontSize: 8, fontWeight: '800', marginTop: 1 },
  player: { position: 'absolute', zIndex: 5 },
  npc: { position: 'absolute', width: '46%', height: '70%', right: -3, bottom: -4, zIndex: 4 },
  characterImage: { width: '100%', height: '100%' },
  contactShadow: { position: 'absolute', zIndex: 4, borderRadius: 999, backgroundColor: 'rgba(10,20,27,0.34)', transform: [{ scaleY: 0.42 }] },
  previewFrame: { position: 'relative', overflow: 'hidden', backgroundColor: '#8FD5EC', borderWidth: 2, borderColor: '#17364C', borderRadius: 14 },
  foreground: { ...StyleSheet.absoluteFill, zIndex: 6 },
  foregroundLeaf: { position: 'absolute', left: 13, bottom: 12, color: 'rgba(255,226,112,0.8)', fontSize: 22 },
  foregroundLeafSmall: { position: 'absolute', right: 24, top: '30%', color: 'rgba(255,255,255,0.7)', fontSize: 22 },
  actionBubble: { position: 'absolute', minWidth: 92, minHeight: 51, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 3, borderColor: '#17364C', zIndex: 10, shadowColor: '#10283A', shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 7 },
  actionHighlighted: { borderColor: '#F2B62F', backgroundColor: '#FFF7D4' },
  left: { left: 10, bottom: '29%' },
  right: { right: 10, bottom: '31%' },
  door: { right: 12, top: '18%' },
  actionIcon: { fontSize: 22 },
  actionCopy: { marginLeft: 5 },
  actionLabel: { color: '#17364C', fontSize: 10, fontWeight: '900' },
  actionHint: { color: '#318250', fontSize: 8, fontWeight: '900', marginTop: 1 },
});
