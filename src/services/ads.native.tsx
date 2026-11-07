import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import type { InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';

import { colors } from '../theme';
import { rewardedRequestOptions } from './adRequest';
import { ensureGuestSession } from './backend/authService';

type GoogleMobileAdsSdk = typeof import('react-native-google-mobile-ads');

// Expo Go has a fixed native runtime and does not include the Google Mobile Ads
// module. Keep the require lazy so merely opening the app in Expo Go cannot ask
// TurboModuleRegistry for a native module that is not present.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const googleMobileAdsSdk: GoogleMobileAdsSdk | null = IS_EXPO_GO
  ? null
  // The conditional CommonJS load is intentional: an ESM import would crash Expo Go before this guard can run.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : require('react-native-google-mobile-ads') as GoogleMobileAdsSdk;

const INTERSTITIAL_COOLDOWN_MS = 180_000;

type AdContextValue = {
  showRewardedAd: (placement: string) => Promise<boolean>;
  showInterstitialIfEligible: () => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
  privacyOptionsRequired: boolean;
  adsReady: boolean;
};

const AdContext = createContext<AdContextValue | null>(null);

function configuredUnitId(kind: 'rewarded' | 'interstitial', sdk: GoogleMobileAdsSdk): string | null {
  const testMode = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';
  if (testMode) return kind === 'rewarded' ? sdk.TestIds.REWARDED : sdk.TestIds.INTERSTITIAL;
  if (Platform.OS === 'android') {
    return kind === 'rewarded'
      ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID?.trim() || null
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID?.trim() || null;
  }
  if (Platform.OS === 'ios') {
    return kind === 'rewarded'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID?.trim() || null
      : process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID?.trim() || null;
  }
  return null;
}

function NativeRewardedAdProvider({ children }: PropsWithChildren) {
  const sdk = googleMobileAdsSdk!;

  const {
    default: mobileAds,
    AdEventType,
    AdsConsent,
    AdsConsentPrivacyOptionsRequirementStatus,
    InterstitialAd,
    MaxAdContentRating,
    RewardedAd,
    RewardedAdEventType,
  } = sdk;
  const [adsReady, setAdsReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const activeRewarded = useRef<RewardedAd | null>(null);
  const interstitial = useRef<InterstitialAd | null>(null);
  const interstitialLoaded = useRef(false);
  const rewardedResolver = useRef<((earned: boolean) => void) | null>(null);
  const showingRewarded = useRef(false);
  const lastInterstitialAt = useRef(0);

  useEffect(() => {
    let active = true;
    const subscriptions: (() => void)[] = [];
    lastInterstitialAt.current = Date.now();

    const prepareAds = async () => {
      try {
        const consent = await AdsConsent.requestInfoUpdate();
        const resolvedConsent = consent.isConsentFormAvailable
          ? await AdsConsent.loadAndShowConsentFormIfRequired()
          : consent;
        if (active) {
          setPrivacyOptionsRequired(
            resolvedConsent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
          );
        }
      } catch {
        if (active) setPrivacyOptionsRequired(false);
      }

      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.PG,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
      } catch {
        if (active) setAdsReady(false);
        return;
      }

      if (!active) return;
      const rewardedUnitId = configuredUnitId('rewarded', sdk);
      const interstitialUnitId = configuredUnitId('interstitial', sdk);

      if (interstitialUnitId) {
        const ad = InterstitialAd.createForAdRequest(interstitialUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });
        interstitial.current = ad;
        subscriptions.push(
          ad.addAdEventListener(AdEventType.LOADED, () => {
            interstitialLoaded.current = true;
          }),
          ad.addAdEventListener(AdEventType.OPENED, () => {
            lastInterstitialAt.current = Date.now();
          }),
          ad.addAdEventListener(AdEventType.CLOSED, () => {
            interstitialLoaded.current = false;
            ad.load();
          }),
          ad.addAdEventListener(AdEventType.ERROR, () => {
            interstitialLoaded.current = false;
          }),
        );
        ad.load();
      }

      setAdsReady(Boolean(rewardedUnitId || interstitialUnitId));
    };

    void prepareAds();
    return () => {
      active = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
      rewardedResolver.current?.(false);
      rewardedResolver.current = null;
      activeRewarded.current?.destroy();
      interstitial.current?.destroy();
      activeRewarded.current = null;
      interstitial.current = null;
    };
    // The native SDK object and its enum members are immutable for the lifetime of the installed binary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showRewardedAd = useCallback(async (placement: string) => {
    if (showingRewarded.current) return false;

    const rewardedUnitId = configuredUnitId('rewarded', sdk);
    if (!rewardedUnitId) return false;

    let userId: string;
    try {
      const session = await ensureGuestSession();
      if (session.status !== 'ready') return false;
      userId = session.user.id;
    } catch {
      return false;
    }

    showingRewarded.current = true;
    return new Promise<boolean>((resolve) => {
      let earned = false;
      let settled = false;
      let loadTimeout: ReturnType<typeof setTimeout> | null = null;
      const unsubscribers: (() => void)[] = [];
      const ad = RewardedAd.createForAdRequest(
        rewardedUnitId,
        rewardedRequestOptions(userId, placement),
      );
      activeRewarded.current = ad;

      const finish = (completed: boolean) => {
        if (settled) return;
        settled = true;
        if (loadTimeout) clearTimeout(loadTimeout);
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        ad.destroy();
        if (activeRewarded.current === ad) activeRewarded.current = null;
        showingRewarded.current = false;
        rewardedResolver.current = null;
        resolve(completed);
      };

      rewardedResolver.current = (completed) => finish(completed);
      unsubscribers.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
          }
          void ad.show().catch(() => finish(false));
        }),
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
        ad.addAdEventListener(AdEventType.ERROR, () => finish(earned)),
      );
      loadTimeout = setTimeout(() => finish(false), 30_000);
      ad.load();
    });
    // The native SDK object and its enum members are immutable for the lifetime of the installed binary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showInterstitialIfEligible = useCallback(async () => {
    const ad = interstitial.current;
    if (!ad || !interstitialLoaded.current) {
      ad?.load();
      return false;
    }
    if (Date.now() - lastInterstitialAt.current < INTERSTITIAL_COOLDOWN_MS) return false;
    try {
      await ad.show();
      return true;
    } catch {
      return false;
    }
  }, []);

  const showPrivacyOptions = useCallback(async () => {
    try {
      const consent = await AdsConsent.showPrivacyOptionsForm();
      setPrivacyOptionsRequired(
        consent.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
      );
    } catch {
      // The privacy form is unavailable outside regulated regions or before AdMob is configured.
    }
    // The native SDK object and its enum members are immutable for the lifetime of the installed binary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    showRewardedAd,
    showInterstitialIfEligible,
    showPrivacyOptions,
    privacyOptionsRequired,
    adsReady,
  }), [adsReady, privacyOptionsRequired, showInterstitialIfEligible, showPrivacyOptions, showRewardedAd]);

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

function SimulatedRewardedAdProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [placement, setPlacement] = useState('Reward');
  const running = useRef(false);

  const showRewardedAd = useCallback(async (nextPlacement: string) => {
    if (running.current) return false;
    running.current = true;
    setPlacement(nextPlacement);
    setSeconds(5);
    setVisible(true);
    for (let remaining = 4; remaining >= 0; remaining -= 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
      setSeconds(remaining);
    }
    setVisible(false);
    running.current = false;
    return true;
  }, []);

  const showInterstitialIfEligible = useCallback(async () => false, []);
  const showPrivacyOptions = useCallback(async () => undefined, []);
  const value = useMemo(() => ({
    showRewardedAd,
    showInterstitialIfEligible,
    showPrivacyOptions,
    privacyOptionsRequired: false,
    adsReady: true,
  }), [showInterstitialIfEligible, showPrivacyOptions, showRewardedAd]);

  return (
    <AdContext.Provider value={value}>
      {children}
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.backdrop}>
          <View style={styles.adCard}>
            <Text style={styles.adLabel}>SIMULATED REWARDED AD</Text>
            <Text style={styles.adIcon}>▶️</Text>
            <Text style={styles.adTitle}>Watching ad...</Text>
            <Text style={styles.placement}>{placement}</Text>
            <Text style={styles.countdown}>{seconds > 0 ? `${seconds}s` : 'Reward unlocked!'}</Text>
            <Text style={styles.note}>Expo Go uses a test ad. Store builds use Google Mobile Ads.</Text>
          </View>
        </View>
      </Modal>
    </AdContext.Provider>
  );
}

export function RewardedAdProvider({ children }: PropsWithChildren) {
  if (IS_EXPO_GO) return <SimulatedRewardedAdProvider>{children}</SimulatedRewardedAdProvider>;
  return <NativeRewardedAdProvider>{children}</NativeRewardedAdProvider>;
}

export function useRewardedAd(): AdContextValue {
  const context = useContext(AdContext);
  if (!context) throw new Error('useRewardedAd must be used inside RewardedAdProvider');
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  adCard: {
    width: '100%',
    maxWidth: 380,
    padding: 28,
    borderRadius: 24,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
  },
  adLabel: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  adIcon: { fontSize: 56, marginVertical: 18 },
  adTitle: { color: colors.text, fontSize: 25, fontWeight: '900' },
  placement: { color: colors.muted, marginTop: 4 },
  countdown: { color: colors.green, fontSize: 22, fontWeight: '800', marginTop: 18 },
  note: { color: colors.muted, fontSize: 12, marginTop: 14, textAlign: 'center' },
});
