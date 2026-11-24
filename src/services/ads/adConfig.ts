import { Platform } from 'react-native';

export type RewardedPlacement = 'energy' | 'salary' | 'opportunity' | 'cash' | 'offline' | 'study' | 'protection';

export const REWARDED_COOLDOWNS_MS: Record<'energy' | 'salary' | 'opportunity', number> = {
  energy: 10 * 60_000,
  salary: 20 * 60_000,
  opportunity: 30 * 60_000,
};

export const INTERSTITIAL_POLICY = {
  sessionWarmupMs: 3 * 60_000,
  cooldownMs: 5 * 60_000,
  windowMs: 30 * 60_000,
  maxPerWindow: 3,
  transitionsRequired: 2,
  rewardedSeparationMs: 30_000,
} as const;

type TestIds = { REWARDED: string; INTERSTITIAL: string };

export function adUnitId(kind: 'rewarded' | 'interstitial', testIds: TestIds): string | null {
  if (__DEV__ || process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true') {
    return kind === 'rewarded' ? testIds.REWARDED : testIds.INTERSTITIAL;
  }
  const value = Platform.OS === 'android'
    ? kind === 'rewarded'
      ? process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID
      : process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID
    : kind === 'rewarded'
      ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID
      : process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_ID;
  return value?.trim() || null;
}

export function cooldownRemaining(readyAt: number | undefined, now = Date.now()): number {
  if (!readyAt || !Number.isFinite(readyAt)) return 0;
  return Math.max(0, readyAt - now);
}

