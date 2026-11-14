import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { CharacterAvatar } from '../components/CharacterAvatar';
import { PlayerCharacter } from '../components/PlayerCharacter';
import { AvatarFramePreview } from '../components/scene/SceneStage';
import { Screen } from '../components/Screen';
import { SKIN_TONES, hairstyleIndexesForGender } from '../data/artManifest';
import hairBounds from '../data/avatarHairBounds.json';
import layerCheck from '../data/avatarLayerCheck.json';
import { AVATAR_ANCHORS, AVATAR_CANVAS, AVATAR_CREATOR_LAYOUT, AVATAR_GENDER_ANCHORS, AVATAR_HAIR_FITS, AVATAR_HEADSHOT_CROP, AVATAR_OUTFIT_FITS, AVATAR_OUTFIT_TOKENS } from '../data/avatarAnchors';
import { ETHNICITIES } from '../data/living';
import { createInitialLifeState, type CharacterProfile } from '../store/lifeStore';
import { colors } from '../theme';

const GENDERS = ['male', 'female'] as const;
const HAIRSTYLES_PER_GENDER = 3;
const COMBINATION_COUNT = GENDERS.length * ETHNICITIES.length * HAIRSTYLES_PER_GENDER * SKIN_TONES.length * AVATAR_OUTFIT_TOKENS.length;

function debugCharacter(index: number): CharacterProfile {
  let remaining = index;
  const gender = GENDERS[remaining % GENDERS.length] ?? 'male';
  remaining = Math.floor(remaining / GENDERS.length);
  const ethnicity = ETHNICITIES[remaining % ETHNICITIES.length]?.id ?? 'european';
  remaining = Math.floor(remaining / ETHNICITIES.length);
  const genderHair = hairstyleIndexesForGender(gender);
  const hairStyle = genderHair[remaining % HAIRSTYLES_PER_GENDER] ?? (gender === 'female' ? 3 : 0);
  remaining = Math.floor(remaining / HAIRSTYLES_PER_GENDER);
  const skinIndex = remaining % SKIN_TONES.length;
  remaining = Math.floor(remaining / SKIN_TONES.length);
  const outfitIndex = remaining % AVATAR_OUTFIT_TOKENS.length;
  return {
    ...createInitialLifeState().character,
    name: 'Debug Avatar',
    gender,
    pronouns: gender === 'female' ? 'she/her' : 'he/him',
    ethnicity,
    avatar: {
      ...createInitialLifeState().character.avatar,
      skin: SKIN_TONES[skinIndex] ?? SKIN_TONES[2],
      hairStyle,
      outfitColor: AVATAR_OUTFIT_TOKENS[outfitIndex] ?? AVATAR_OUTFIT_TOKENS[0],
    },
  };
}

export function AvatarDebugScreen() {
  const [index, setIndex] = React.useState(0);
  const [autoCycle, setAutoCycle] = React.useState(false);
  const [layerTints, setLayerTints] = React.useState(false);
  const character = debugCharacter(index);
  const fit = AVATAR_HAIR_FITS[character.avatar.hairStyle] ?? AVATAR_HAIR_FITS[0];
  const bounds = hairBounds[character.avatar.hairStyle] ?? hairBounds[0];
  const renderGender = character.gender === 'female' ? 'female' : 'male';
  const genderAnchors = AVATAR_GENDER_ANCHORS[renderGender];
  const outfitFit = AVATAR_OUTFIT_FITS.casual[renderGender];
  const hairPass = !!bounds
    && bounds.top <= AVATAR_ANCHORS.headTop.y
    && bounds.left <= AVATAR_ANCHORS.templeLeft.x
    && bounds.right >= AVATAR_ANCHORS.templeRight.x
    && bounds.left > 0
    && bounds.right < AVATAR_CANVAS.width - 1
    && bounds.bottom < AVATAR_CANVAS.portraitHeight - 1
    && (fit?.frontMode !== 'split' || (Math.max(bounds.leftRun, bounds.rightRun) <= 64 && bounds.bottomRun <= 48));
  const eyesPass = !!bounds && bounds.leftEyeCoverage <= 0.3 && bounds.rightEyeCoverage <= 0.3;
  const neckPass = outfitFit.collarTopY >= genderAnchors.chin + (genderAnchors.chin - genderAnchors.headTop) * 0.08;
  const edgePass = layerCheck.passed && layerCheck.violations.length === 0;
  const gearPass = !AVATAR_CREATOR_LAYOUT.showsSettingsGear;
  const framePass = AVATAR_HEADSHOT_CROP.bottomAligned && AVATAR_HEADSHOT_CROP.canvasBleedScale > 1;
  const geometryPass = hairPass && eyesPass && neckPass && edgePass && gearPass && framePass;

  React.useEffect(() => {
    if (!autoCycle) return undefined;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % COMBINATION_COUNT), 900);
    return () => clearTimeout(timer);
  }, [autoCycle, index]);

  return (
    <Screen edges={['right', 'bottom', 'left']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Avatar Debug</Text>
        <Text style={styles.meta}>Combination {index + 1} of {COMBINATION_COUNT}</Text>
        <Text style={styles.section}>CREATOR AND HUD CROPS</Text>
        <View style={styles.portraitFrame}><PlayerCharacter character={character} mode="portrait" debugLayers={layerTints} showAnchors style={styles.portrait} /></View>
        <View style={styles.hudRow}>
          <View style={styles.hudExample}><CharacterAvatar character={character} size={46} /><Text style={styles.deviceLabel}>Small HUD</Text></View>
          <View style={styles.hudExample}><CharacterAvatar character={character} size={64} /><Text style={styles.deviceLabel}>Large HUD</Text></View>
        </View>
        <Text style={styles.name}>{character.gender === 'female' ? 'Female' : 'Male'} · {fit?.label ?? 'Hair'} · {character.avatar.skin}</Text>
        <Text style={styles.fit}>Fit x {fit?.fit.x ?? 0}, y {fit?.fit.y ?? 0}, scale {fit?.fit.scale ?? 1}</Text>
        <Text style={styles.fit}>Anchors: {fit?.attachments.join(', ') ?? 'none'}</Text>
        <View style={styles.badges}>
          <Text style={hairPass ? styles.pass : styles.fail}>{hairPass ? 'HAIR PASS' : 'HAIR FAIL'}</Text>
          <Text style={eyesPass ? styles.pass : styles.fail}>{eyesPass ? 'EYES PASS' : 'EYES FAIL'}</Text>
          <Text style={neckPass ? styles.pass : styles.fail}>{neckPass ? 'NECK PASS' : 'NECK FAIL'}</Text>
          <Text style={edgePass ? styles.pass : styles.fail}>{edgePass ? 'ALPHA EDGES PASS' : 'ALPHA EDGES FAIL'}</Text>
          <Text style={gearPass ? styles.pass : styles.fail}>{gearPass ? 'GEAR LAYOUT PASS' : 'GEAR LAYOUT FAIL'}</Text>
          <Text style={framePass ? styles.pass : styles.fail}>{framePass ? 'FRAME PASS' : 'FRAME FAIL'}</Text>
          <Text style={geometryPass ? styles.pass : styles.fail}>{geometryPass ? 'ALL CHECKS PASS' : 'CHECKS FAILED'}</Text>
        </View>
        <Text style={styles.section}>FULL SCENE FRAMING</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
          <View><Text style={styles.deviceLabel}>iPhone SE scene</Text><AvatarFramePreview character={character} width={300} height={360} framing="full" debugLayers={layerTints} showAnchors /></View>
          <View><Text style={styles.deviceLabel}>Large phone scene</Text><AvatarFramePreview character={character} width={390} height={470} framing="full" debugLayers={layerTints} showAnchors /></View>
        </ScrollView>
        <Text style={styles.section}>BUST BANNER FRAMING</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
          <View><Text style={styles.deviceLabel}>iPhone SE banner</Text><AvatarFramePreview character={character} width={300} height={160} framing="bust" debugLayers={layerTints} showAnchors /></View>
          <View><Text style={styles.deviceLabel}>Large phone banner</Text><AvatarFramePreview character={character} width={390} height={190} framing="bust" debugLayers={layerTints} showAnchors /></View>
        </ScrollView>
        <View style={styles.toggleRow}><Text style={styles.toggleText}>Auto-cycle every combination</Text><Switch value={autoCycle} onValueChange={setAutoCycle} /></View>
        <View style={styles.toggleRow}><Text style={styles.toggleText}>Tint each layer</Text><Switch value={layerTints} onValueChange={setLayerTints} /></View>
        <View style={styles.buttons}>
          <AppButton variant="ghost" style={styles.button} onPress={() => setIndex((current) => (current - 1 + COMBINATION_COUNT) % COMBINATION_COUNT)}>PREVIOUS</AppButton>
          <AppButton style={styles.button} onPress={() => setIndex((current) => (current + 1) % COMBINATION_COUNT)}>NEXT</AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  title: { color: colors.text, fontFamily: 'LilitaOne_400Regular', fontSize: 30 },
  meta: { color: colors.muted, fontSize: 11, fontWeight: '800', marginBottom: 12 },
  portraitFrame: { width: 300, height: 300, maxWidth: '100%', overflow: 'hidden', borderRadius: 28, borderWidth: 3, borderColor: colors.text, backgroundColor: '#8FD5EC' },
  portrait: { width: '100%', height: '100%' },
  name: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  fit: { color: colors.muted, fontSize: 10, marginTop: 4, textAlign: 'center' },
  pass: { color: colors.greenDark, fontSize: 10, fontWeight: '900', marginTop: 6 },
  fail: { color: colors.danger, fontSize: 10, fontWeight: '900', marginTop: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 360 },
  section: { width: '100%', maxWidth: 390, color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 16, marginBottom: 7 },
  hudRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 24, marginTop: 10 },
  hudExample: { alignItems: 'center', gap: 4 },
  deviceLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', marginBottom: 4 },
  previewRow: { gap: 12, paddingHorizontal: 2, paddingBottom: 5 },
  toggleRow: { width: '100%', maxWidth: 360, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  buttons: { width: '100%', maxWidth: 360, flexDirection: 'row', gap: 10, marginTop: 14 },
  button: { flex: 1 },
});
