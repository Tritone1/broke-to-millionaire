import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const INTERSTITIAL_COOLDOWN_MS = 180_000;

type AdContextValue = {
  showRewardedAd: (placement: string) => Promise<boolean>;
  showInterstitialIfEligible: () => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
  privacyOptionsRequired: boolean;
  adsReady: boolean;
};

const AdContext = createContext<AdContextValue | null>(null);

function configuredUnitId(kind: 'rewarded' | 'interstitial'): string | null {
  const testMode = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';
  if (testMode) return kind === 'rewarded' ? TestIds.REWARDED : TestIds.INTERSTITIAL;
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

export function RewardedAdProvider({ children }: PropsWithChildren) {
  const [adsReady, setAdsReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const rewarded = useRef<RewardedAd | null>(null);
  const interstitial = useRef<InterstitialAd | null>(null);
  const rewardedLoaded = useRef(false);
  const interstitialLoaded = useRef(false);
  const rewardedEarned = useRef(false);
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
      const rewardedUnitId = configuredUnitId('rewarded');
      const interstitialUnitId = configuredUnitId('interstitial');

      if (rewardedUnitId) {
        const ad = RewardedAd.createForAdRequest(rewardedUnitId, {
          requestNonPersonalizedAdsOnly: false,
        });
        rewarded.current = ad;
        subscriptions.push(
          ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            rewardedLoaded.current = true;
          }),
          ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            rewardedEarned.current = true;
          }),
          ad.addAdEventListener(AdEventType.CLOSED, () => {
            const earned = rewardedEarned.current;
            rewardedLoaded.current = false;
            rewardedEarned.current = false;
            showingRewarded.current = false;
            rewardedResolver.current?.(earned);
            rewardedResolver.current = null;
            ad.load();
          }),
          ad.addAdEventListener(AdEventType.ERROR, () => {
            rewardedLoaded.current = false;
            showingRewarded.current = false;
            rewardedResolver.current?.(false);
            rewardedResolver.current = null;
          }),
        );
        ad.load();
      }

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
      rewarded.current?.destroy();
      interstitial.current?.destroy();
      rewarded.current = null;
      interstitial.current = null;
    };
  }, []);

  const showRewardedAd = useCallback(async (_placement: string) => {
    const ad = rewarded.current;
    if (!ad || !rewardedLoaded.current || showingRewarded.current) {
      ad?.load();
      return false;
    }
    showingRewarded.current = true;
    rewardedEarned.current = false;
    return new Promise<boolean>((resolve) => {
      rewardedResolver.current = resolve;
      void ad.show().catch(() => {
        showingRewarded.current = false;
        rewardedResolver.current = null;
        resolve(false);
      });
    });
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

export function useRewardedAd(): AdContextValue {
  const context = useContext(AdContext);
  if (!context) throw new Error('useRewardedAd must be used inside RewardedAdProvider');
  return context;
}
