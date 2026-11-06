import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type AdContextValue = {
  showRewardedAd: (placement: string) => Promise<boolean>;
  showInterstitialIfEligible: () => Promise<boolean>;
  showPrivacyOptions: () => Promise<void>;
  privacyOptionsRequired: boolean;
  adsReady: boolean;
};

const AdContext = createContext<AdContextValue | null>(null);

export function RewardedAdProvider({ children }: PropsWithChildren) {
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
            <Text style={styles.note}>This placeholder is ready to swap for AdMob.</Text>
          </View>
        </View>
      </Modal>
    </AdContext.Provider>
  );
}

export function useRewardedAd(): AdContextValue {
  const context = useContext(AdContext);
  if (!context) throw new Error('useRewardedAd must be used inside RewardedAdProvider');
  return context;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  adCard: { width: '100%', maxWidth: 380, padding: 28, borderRadius: 24, backgroundColor: '#151515', borderWidth: 1, borderColor: colors.goldDark, alignItems: 'center' },
  adLabel: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  adIcon: { fontSize: 56, marginVertical: 18 },
  adTitle: { color: colors.text, fontSize: 25, fontWeight: '900' },
  placement: { color: colors.muted, marginTop: 4 },
  countdown: { color: colors.green, fontSize: 22, fontWeight: '800', marginTop: 18 },
  note: { color: colors.muted, fontSize: 12, marginTop: 14, textAlign: 'center' },
});
