import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Modal, StyleSheet, View } from 'react-native';
import { Text } from '../components/LocalizedText';
import type { InterstitialAd, RewardedAd } from 'react-native-google-mobile-ads';

import { colors } from '../theme';
import { rewardedRequestOptions } from './adRequest';
import { beginAdPresentation, endAdPresentation } from './adLifecycle';
import { ensureGuestSession } from './backend/authService';
import { useAdAccessStore } from '../store/adAccessStore';
import { trackAdEvent } from './ads/adAnalytics';
import { adUnitId } from './ads/adConfig';
import { canShowInterstitial, createInterstitialSession, recordInterstitialShown, recordMeaningfulTransition, recordRewardedAd } from './ads/interstitialPolicy';

type GoogleMobileAdsSdk = typeof import('react-native-google-mobile-ads');

// Expo Go has a fixed native runtime and does not include the Google Mobile Ads
// module. Keep the require lazy so merely opening the app in Expo Go cannot ask
// TurboModuleRegistry for a native module that is not present.
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let cachedGoogleMobileAdsSdk: GoogleMobileAdsSdk | null | undefined;

function getGoogleMobileAdsSdk(): GoogleMobileAdsSdk | null {
  if (IS_EXPO_GO) return null;
  if (cachedGoogleMobileAdsSdk !== undefined) return cachedGoogleMobileAdsSdk;
  try {
    // The conditional CommonJS load is intentional: an ESM import would crash Expo Go before this guard can run.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedGoogleMobileAdsSdk = require('react-native-google-mobile-ads') as GoogleMobileAdsSdk;
  } catch {
    cachedGoogleMobileAdsSdk = null;
  }
  return cachedGoogleMobileAdsSdk;
}

export type RewardedAdStatus = 'idle' | 'loading' | 'showing' | 'completed' | 'failed' | 'unavailable';

type AdContextValue = {
  showRewardedAd: (placement: string) => Promise<boolean>;
  showInterstitialIfEligible: (transition?: string) => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
  privacyOptionsRequired: boolean;
  adsReady: boolean;
  cashRewardsRequireServerClaim: boolean;
  rewardedStatus: RewardedAdStatus;
};

const AdContext = createContext<AdContextValue | null>(null);

function NativeRewardedAdProvider({ children, sdk }: PropsWithChildren<{ sdk: GoogleMobileAdsSdk }>) {

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
  const [rewardedStatus, setRewardedStatus] = useState<RewardedAdStatus>('idle');
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const removeAds = useAdAccessStore((state) => state.removeAds);
  const activeRewarded = useRef<RewardedAd | null>(null);
  const interstitial = useRef<InterstitialAd | null>(null);
  const interstitialLoaded = useRef(false);
  const rewardedResolver = useRef<((earned: boolean) => void) | null>(null);
  const showingRewarded = useRef(false);
  const showingInterstitial = useRef(false);
  const interstitialSession = useRef(createInterstitialSession());

  useEffect(() => {
    let active = true;
    const subscriptions: (() => void)[] = [];
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
      const rewardedUnitId = adUnitId('rewarded', sdk.TestIds);
      const interstitialUnitId = adUnitId('interstitial', sdk.TestIds);

      if (interstitialUnitId) {
        const ad = InterstitialAd.createForAdRequest(interstitialUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });
        interstitial.current = ad;
        subscriptions.push(
          ad.addAdEventListener(AdEventType.LOADED, () => {
            interstitialLoaded.current = true;
            trackAdEvent('ad_loaded', { format: 'interstitial' });
          }),
          ad.addAdEventListener(AdEventType.OPENED, () => {
            showingInterstitial.current = true;
            interstitialSession.current = recordInterstitialShown(interstitialSession.current);
            beginAdPresentation();
            trackAdEvent('ad_displayed', { format: 'interstitial' });
            trackAdEvent('interstitial_shown', { format: 'interstitial' });
          }),
          ad.addAdEventListener(AdEventType.CLOSED, () => {
            endAdPresentation();
            showingInterstitial.current = false;
            interstitialLoaded.current = false;
            trackAdEvent('ad_dismissed', { format: 'interstitial' });
            ad.load();
          }),
          ad.addAdEventListener(AdEventType.ERROR, () => {
            endAdPresentation();
            showingInterstitial.current = false;
            interstitialLoaded.current = false;
            trackAdEvent('ad_failed', { format: 'interstitial', code: 'sdk_error' });
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

    const rewardedUnitId = adUnitId('rewarded', sdk.TestIds);
    if (!rewardedUnitId || showingInterstitial.current) {
      setRewardedStatus('unavailable');
      return false;
    }

    let userId: string;
    try {
      const session = await ensureGuestSession();
      if (session.status !== 'ready') return false;
      userId = session.user.id;
    } catch {
      return false;
    }

    showingRewarded.current = true;
    setRewardedStatus('loading');
    trackAdEvent('ad_requested', { format: 'rewarded', placement });
    return new Promise<boolean>((resolve) => {
      let earned = false;
      let settled = false;
      let presented = false;
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
        if (presented) endAdPresentation();
        if (presented) interstitialSession.current = recordRewardedAd(interstitialSession.current);
        if (activeRewarded.current === ad) activeRewarded.current = null;
        showingRewarded.current = false;
        rewardedResolver.current = null;
        setRewardedStatus(completed ? 'completed' : presented ? 'failed' : 'unavailable');
        if (presented) trackAdEvent('ad_dismissed', { format: 'rewarded', placement });
        if (!completed) trackAdEvent('ad_failed', { format: 'rewarded', placement, code: presented ? 'not_earned' : 'not_loaded' });
        resolve(completed);
      };

      rewardedResolver.current = (completed) => finish(completed);
      unsubscribers.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (loadTimeout) {
            clearTimeout(loadTimeout);
            loadTimeout = null;
          }
          presented = true;
          beginAdPresentation();
          setRewardedStatus('showing');
          trackAdEvent('ad_loaded', { format: 'rewarded', placement });
          trackAdEvent('ad_displayed', { format: 'rewarded', placement });
          void ad.show().catch(() => finish(false));
        }),
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          if (earned) return;
          earned = true;
          trackAdEvent('reward_earned', { format: 'rewarded', placement });
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

  const showInterstitialIfEligible = useCallback(async (transition = 'major_transition') => {
    interstitialSession.current = recordMeaningfulTransition(interstitialSession.current);
    if (removeAds || showingRewarded.current || showingInterstitial.current) return false;
    if (!canShowInterstitial(interstitialSession.current)) return false;
    const ad = interstitial.current;
    if (!ad || !interstitialLoaded.current) {
      ad?.load();
      return false;
    }
    try {
      trackAdEvent('ad_requested', { format: 'interstitial', placement: transition });
      await ad.show();
      return true;
    } catch {
      return false;
    }
  }, [removeAds]);

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
    cashRewardsRequireServerClaim: true,
    rewardedStatus,
  }), [adsReady, privacyOptionsRequired, rewardedStatus, showInterstitialIfEligible, showPrivacyOptions, showRewardedAd]);

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

function SimulatedRewardedAdProvider({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [placement, setPlacement] = useState('Reward');
  const [rewardedStatus, setRewardedStatus] = useState<RewardedAdStatus>('idle');
  const running = useRef(false);

  const showRewardedAd = useCallback(async (nextPlacement: string) => {
    if (running.current) return false;
    running.current = true;
    setRewardedStatus('showing');
    setPlacement(nextPlacement);
    setSeconds(5);
    setVisible(true);
    for (let remaining = 4; remaining >= 0; remaining -= 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
      setSeconds(remaining);
    }
    setVisible(false);
    running.current = false;
    setRewardedStatus('completed');
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
    cashRewardsRequireServerClaim: false,
    rewardedStatus,
  }), [rewardedStatus, showInterstitialIfEligible, showPrivacyOptions, showRewardedAd]);

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
  const sdk = getGoogleMobileAdsSdk();
  if (!sdk) return <SimulatedRewardedAdProvider>{children}</SimulatedRewardedAdProvider>;
  return <NativeRewardedAdProvider sdk={sdk}>{children}</NativeRewardedAdProvider>;
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
