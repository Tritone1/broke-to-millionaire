import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { PlayerCharacter } from '../components/PlayerCharacter';
import { Screen } from '../components/Screen';
import { ETHNICITIES, type EthnicityId } from '../data/living';
import { HAIRSTYLES, SKIN_TONES, hairstyleIndexesForGender, normalizeHairstyleForGender } from '../data/artManifest';
import { AVATAR_CREATOR_LAYOUT } from '../data/avatarAnchors';
import { useSessionStore } from '../store/sessionStore';
import type { CharacterProfile, Gender } from '../store/lifeStore';
import { colors } from '../theme';

function previewAppearance() {
  const search = (globalThis as { location?: { search?: string } }).location?.search;
  const params = search ? new URLSearchParams(search) : null;
  const requestedEthnicity = params?.get('ethnicity');
  const ethnicity = ETHNICITIES.some((item) => item.id === requestedEthnicity) ? requestedEthnicity as EthnicityId : 'european';
  const requestedHair = Math.max(0, Math.min(HAIRSTYLES.length - 1, Number(params?.get('hair')) || 0));
  const requestedSkin = params?.get('skin');
  const parsedSkin = requestedSkin === null || requestedSkin === undefined ? 2 : Number(requestedSkin);
  const skin = Math.max(0, Math.min(SKIN_TONES.length - 1, Number.isFinite(parsedSkin) ? parsedSkin : 2));
  const gender = params?.get('gender') === 'female' ? 'female' as const : 'male' as const;
  return { gender, ethnicity, hair: normalizeHairstyleForGender(requestedHair, gender), skin };
}

export function CharacterSetupScreen() {
  const session = useSessionStore();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const contentWidth = Math.min(444, Math.max(284, viewportWidth - 36));
  const initialAppearance = React.useMemo(() => previewAppearance(), []);
  const [reviewing, setReviewing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [gender, setGender] = React.useState<Gender>(initialAppearance.gender);
  const [ethnicity, setEthnicity] = React.useState<EthnicityId>(initialAppearance.ethnicity);
  const [avatar, setAvatar] = React.useState<CharacterProfile['avatar']>({ skin: SKIN_TONES[initialAppearance.skin] ?? SKIN_TONES[2], hairStyle: initialAppearance.hair, hairColor: '#2A1A12', outfitColor: '#176B42' });
  const character: CharacterProfile = {
    name: name.trim(),
    gender,
    pronouns: gender === 'female' ? 'she/her' : 'he/him',
    ethnicity,
    backgroundId: 'street',
    traits: [],
    avatar,
  };
  const validName = character.name.length >= 2 && character.name.length <= 16;
  const ethnicityName = ETHNICITIES.find((item) => item.id === ethnicity)?.name ?? 'European';
  const availableHairIndexes = hairstyleIndexesForGender(gender);
  const selectGender = (nextGender: Gender) => {
    setGender(nextGender);
    setAvatar((current) => ({ ...current, hairStyle: normalizeHairstyleForGender(current.hairStyle, nextGender) }));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + AVATAR_CREATOR_LAYOUT.bottomPadding }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { width: contentWidth }]}>
        <View style={styles.top}>
          <AppButton variant="ghost" style={styles.back} onPress={reviewing ? () => setReviewing(false) : session.cancelSetup}>BACK</AppButton>
          <Text style={styles.step}>{reviewing ? 'REVIEW' : 'CREATE CHARACTER'}</Text>
        </View>
        <View style={styles.progress}><View style={[styles.progressFill, { width: reviewing ? '100%' : '50%' }]} /></View>

        {!reviewing ? <>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>Create your look</Text>
          <Text style={styles.subtitle}>Everyone starts equally: homeless, unemployed, and ready to build a life.</Text>
          <View style={styles.avatarStage}><PlayerCharacter character={character} mode="portrait" style={styles.avatarCharacter} /></View>
          <Text style={styles.label}>NAME · 2–16 CHARACTERS</Text>
          <TextInput value={name} onChangeText={(value) => setName(value.slice(0, 16))} placeholder="Your name" placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="words" />
          {!validName && name.length > 0 ? <Text style={styles.error}>Name must contain at least 2 characters.</Text> : null}

          <Text style={styles.label}>BODY TYPE</Text>
          <View style={styles.genderRow}>{(['male', 'female'] as Gender[]).map((item) => {
            const active = gender === item;
            return <Pressable accessibilityRole="button" key={item} style={[styles.genderChoice, active && styles.choiceActive]} onPress={() => selectGender(item)}><Text style={styles.genderIcon}>{item === 'male' ? '♂' : '♀'}</Text><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item === 'male' ? 'MALE' : 'FEMALE'}</Text></Pressable>;
          })}</View>

          <Text style={styles.label}>ETHNICITY</Text>
          <View style={styles.wrap}>{ETHNICITIES.map((item) => {
            const active = ethnicity === item.id;
            return <Pressable accessibilityRole="button" key={item.id} style={[styles.choice, active && styles.choiceActive]} onPress={() => setEthnicity(item.id)}><Text numberOfLines={1} style={[styles.choiceText, active && styles.choiceTextActive]}>{item.name}</Text></Pressable>;
          })}</View>

          <Text style={styles.label}>SKIN TONE</Text>
          <View style={styles.swatches}>{SKIN_TONES.map((item) => <Pressable accessibilityRole="button" accessibilityLabel={`Skin tone ${item}`} key={item} onPress={() => setAvatar((current) => ({ ...current, skin: item }))} style={[styles.swatch, { backgroundColor: item }, avatar.skin === item && styles.swatchActive]} />)}</View>

          <Text style={styles.label}>HAIRSTYLE</Text>
          <View style={styles.hairGrid}>{availableHairIndexes.map((index) => {
            const item = HAIRSTYLES[index];
            const active = avatar.hairStyle === index;
            return <Pressable accessibilityRole="button" key={item} style={[styles.hairChoice, active && styles.choiceActive]} onPress={() => setAvatar((current) => ({ ...current, hairStyle: index }))}><Text style={styles.hairIcon}>{['✂️', '▰', '➰', '〰', '⌇', '≈'][index]}</Text><Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item}</Text></Pressable>;
          })}</View>

          <Card style={styles.startCard}><Text style={styles.startTitle}>THE SAME START FOR EVERYONE</Text><Text style={styles.startBody}>$0 cash · Homeless · Community meals · Walking · No job</Text></Card>
          <AppButton disabled={!validName} style={styles.next} onPress={() => setReviewing(true)}>CONTINUE</AppButton>
        </> : <>
          <Text style={styles.title}>Ready to begin?</Text>
          <Text style={styles.subtitle}>Your appearance never changes your skills, luck, or starting money.</Text>
          <Card style={styles.summary}>
            <View style={styles.reviewStage}><PlayerCharacter character={character} mode="portrait" style={styles.reviewCharacter} /></View>
            <Text style={styles.summaryName}>{character.name}</Text>
            <Text style={styles.summaryMeta}>{gender === 'female' ? 'Female' : 'Male'} · {ethnicityName} · {HAIRSTYLES[avatar.hairStyle]} hairstyle</Text>
            <View style={styles.summaryLine} />
            <Text style={styles.summaryStart}>STARTING FROM ZERO</Text>
            <Text style={styles.startBody}>Find starter work, choose affordable food and transport, then improve your home to unlock education and better careers.</Text>
          </Card>
          <AppButton style={styles.next} onPress={() => void session.beginGame(character)}>START THIS LIFE</AppButton>
        </>}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { alignItems: 'center', paddingHorizontal: 18, paddingTop: 30 },
  content: { maxWidth: 444 },
  top: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  back: { minHeight: 38, paddingVertical: 5 },
  step: { flex: 1, flexShrink: 1, color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textAlign: 'right' },
  progress: { height: 5, borderRadius: 9, overflow: 'hidden', backgroundColor: colors.surface2, marginTop: 15 },
  progressFill: { height: '100%', backgroundColor: colors.gold },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', marginTop: 26 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 17 },
  avatarStage: { width: 184, height: 204, alignSelf: 'center', marginBottom: 8, borderRadius: 24, overflow: 'hidden', backgroundColor: '#8FD5EC', borderWidth: 3, borderColor: '#17364C' },
  avatarCharacter: { width: '100%', height: '100%', alignSelf: 'center' },
  label: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 16, marginBottom: 7 },
  input: { color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, minHeight: 50, paddingHorizontal: 14, fontSize: 17, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 10, marginTop: 5 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderChoice: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  genderIcon: { color: colors.text, fontSize: 24, fontWeight: '900' },
  choice: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 13 },
  choiceActive: { borderColor: colors.gold, backgroundColor: '#FFF4CF' },
  choiceText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  choiceTextActive: { color: colors.goldDark },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.surface2 },
  swatchActive: { borderColor: colors.gold, transform: [{ scale: 1.12 }] },
  hairGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hairChoice: { width: '31%', minHeight: 67, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 14 },
  hairIcon: { color: colors.text, fontSize: 21, fontWeight: '900' },
  startCard: { marginTop: 22, borderColor: colors.greenDark },
  startTitle: { color: colors.greenDark, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  startBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  summary: { alignItems: 'center', borderColor: colors.goldDark, paddingVertical: 25 },
  reviewStage: { width: 174, height: 194, borderRadius: 20, overflow: 'hidden', backgroundColor: '#8FD5EC', borderWidth: 2, borderColor: '#17364C' },
  reviewCharacter: { width: '100%', height: '100%', alignSelf: 'center' },
  summaryName: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 11 },
  summaryMeta: { color: colors.muted, marginTop: 3 },
  summaryLine: { height: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: 17 },
  summaryStart: { color: colors.greenDark, fontSize: 16, fontWeight: '900' },
  next: { marginTop: 24 },
});
