import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Confetti } from './src/components/Confetti';
import { LifeModals } from './src/components/LifeModals';
import { LIFE_EVENTS } from './src/data/lifeEvents';
import { HAIRSTYLES, SKIN_TONES, normalizeHairstyleForGender } from './src/data/artManifest';
import { ETHNICITIES, type EthnicityId } from './src/data/living';
import { big } from './src/game/BigNumber';
import { useLifeRuntime } from './src/hooks/useLifeRuntime';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CharacterSetupScreen } from './src/screens/CharacterSetupScreen';
import { StartMenuScreen } from './src/screens/StartMenuScreen';
import { RewardedAdProvider } from './src/services/ads';
import { createInitialLifeState, useLifeStore } from './src/store/lifeStore';
import { useSessionStore } from './src/store/sessionStore';
import { usePurchaseStore } from './src/store/purchaseStore';
import { colors } from './src/theme';

function GameApp() {
  useLifeRuntime();
  const phase = useSessionStore((state) => state.phase);
  const bootstrap = useSessionStore((state) => state.bootstrap);
  const hydrated = useLifeStore((state) => state.hydrated);
  const celebrationNonce = useLifeStore((state) => state.celebrationNonce);
  const initializePurchases = usePurchaseStore((state) => state.initialize);

  useEffect(() => {
    void bootstrap().then(() => {
      const search = (globalThis as { location?: { search?: string } }).location?.search;
      const params = search ? new URLSearchParams(search) : null;
      if (params?.get('preview') === 'setup') {
        useSessionStore.setState({ phase: 'setup', activeSlot: null, setupSlot: 1 });
        return;
      }
      if (params?.get('preview') !== 'game') return;
      const now = Date.now();
      const previewScreen = params.get('screen');
      const initial = createInitialLifeState(now);
      const requestedEthnicity = params.get('ethnicity');
      const ethnicity = ETHNICITIES.some((item) => item.id === requestedEthnicity) ? requestedEthnicity as EthnicityId : 'european';
      const hairStyle = Math.max(0, Math.min(HAIRSTYLES.length - 1, Number(params.get('hair')) || 0));
      const requestedSkin = params.get('skin');
      const parsedSkin = requestedSkin === null ? 2 : Number(requestedSkin);
      const skinIndex = Math.max(0, Math.min(SKIN_TONES.length - 1, Number.isFinite(parsedSkin) ? parsedSkin : 2));
      const female = params.get('gender') === 'female';
      const previewGender = female ? 'female' as const : 'male' as const;
      const preview = {
        ...initial,
        character: {
          ...initial.character,
          name: 'Aylin',
          gender: previewGender,
          pronouns: female ? 'she/her' : 'he/him',
          ethnicity,
          avatar: { ...initial.character.avatar, skin: SKIN_TONES[skinIndex] ?? SKIN_TONES[2], hairStyle: normalizeHairstyleForGender(hairStyle, previewGender) },
        },
        money: big(previewScreen === 'Market' || previewScreen === 'Event' ? 125_000 : 2_500),
        lifetimeEarnings: big(125_000),
        jobId: params.get('student') === '1' ? null : 'courier',
        tutorialStep: 3 as const,
        nextLifeEventAt: now + 999_999,
      };
      useLifeStore.getState().hydrate(preview);
      if (previewScreen === 'Event') {
        useLifeStore.setState({ activeLifeEvent: { id: 'preview-event', kind: 'invitation', title: 'A Chance to Help', description: 'A neighbor needs your decision.', eventId: LIFE_EVENTS[0]?.id } });
      }
      useSessionStore.setState({ phase: 'game', activeSlot: 1, setupSlot: null });
    });
  }, [bootstrap]);

  useEffect(() => {
    if (phase === 'game' && hydrated) void initializePurchases();
  }, [hydrated, initializePurchases, phase]);

  if (phase === 'boot') {
    return (
      <View style={styles.loading}>
        <Text style={styles.logo}>$</Text>
        <Text style={styles.title}>RICH SIMULATOR</Text>
        <ActivityIndicator color={colors.gold} size="large" style={styles.spinner} />
      </View>
    );
  }

  if (phase === 'setup') return <CharacterSetupScreen />;
  if (phase !== 'game') return <StartMenuScreen />;
  if (!hydrated) return null;

  return (
    <>
      <AppNavigator />
      <LifeModals />
      <Confetti nonce={celebrationNonce} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    LilitaOne_400Regular: require('@expo-google-fonts/lilita-one/400Regular/LilitaOne_400Regular.ttf'),
    Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    Inter_900Black: require('@expo-google-fonts/inter/900Black/Inter_900Black.ttf'),
  });
  return (
    <SafeAreaProvider>
      <RewardedAdProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? <GameApp /> : <View style={styles.loading}><Text style={styles.logo}>$</Text><ActivityIndicator color={colors.gold} size="large" /></View>}
      </RewardedAdProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72 },
  title: { color: colors.gold, fontSize: 24, fontWeight: '900', fontFamily: 'LilitaOne_400Regular', letterSpacing: 2, marginTop: 12 },
  spinner: { marginTop: 28 },
});
