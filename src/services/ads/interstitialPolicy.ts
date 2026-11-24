import { INTERSTITIAL_POLICY } from './adConfig';

export type InterstitialSession = {
  startedAt: number;
  lastShownAt: number;
  lastRewardedAt: number;
  meaningfulTransitions: number;
  shownAt: number[];
};

export function createInterstitialSession(now = Date.now()): InterstitialSession {
  return { startedAt: now, lastShownAt: 0, lastRewardedAt: 0, meaningfulTransitions: 0, shownAt: [] };
}

export function recordMeaningfulTransition(session: InterstitialSession): InterstitialSession {
  return { ...session, meaningfulTransitions: session.meaningfulTransitions + 1 };
}

export function recordRewardedAd(session: InterstitialSession, now = Date.now()): InterstitialSession {
  return { ...session, lastRewardedAt: now };
}

export function canShowInterstitial(session: InterstitialSession, now = Date.now()): boolean {
  const recent = session.shownAt.filter((shownAt) => now - shownAt < INTERSTITIAL_POLICY.windowMs);
  return now - session.startedAt >= INTERSTITIAL_POLICY.sessionWarmupMs
    && now - session.lastShownAt >= INTERSTITIAL_POLICY.cooldownMs
    && now - session.lastRewardedAt >= INTERSTITIAL_POLICY.rewardedSeparationMs
    && session.meaningfulTransitions >= INTERSTITIAL_POLICY.transitionsRequired
    && recent.length < INTERSTITIAL_POLICY.maxPerWindow;
}

export function recordInterstitialShown(session: InterstitialSession, now = Date.now()): InterstitialSession {
  return {
    ...session,
    lastShownAt: now,
    meaningfulTransitions: 0,
    shownAt: [...session.shownAt.filter((shownAt) => now - shownAt < INTERSTITIAL_POLICY.windowMs), now],
  };
}

