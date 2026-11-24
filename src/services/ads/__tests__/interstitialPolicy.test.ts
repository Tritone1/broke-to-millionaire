import { INTERSTITIAL_POLICY } from '../adConfig';
import { canShowInterstitial, createInterstitialSession, recordInterstitialShown, recordMeaningfulTransition, recordRewardedAd } from '../interstitialPolicy';

describe('interstitial policy', () => {
  it('requires warmup, five-minute spacing, and two transitions', () => {
    const start = 1_000;
    let session = createInterstitialSession(start);
    session = recordMeaningfulTransition(recordMeaningfulTransition(session));
    expect(canShowInterstitial(session, start + INTERSTITIAL_POLICY.sessionWarmupMs - 1)).toBe(false);
    expect(canShowInterstitial(session, start + INTERSTITIAL_POLICY.cooldownMs)).toBe(true);
  });

  it('limits a session window and separates rewarded ads', () => {
    const start = 1_000;
    let session = createInterstitialSession(start);
    let now = start + INTERSTITIAL_POLICY.cooldownMs;
    for (let count = 0; count < 3; count += 1) {
      session = recordMeaningfulTransition(recordMeaningfulTransition(session));
      expect(canShowInterstitial(session, now)).toBe(true);
      session = recordInterstitialShown(session, now);
      now += INTERSTITIAL_POLICY.cooldownMs;
    }
    session = recordMeaningfulTransition(recordMeaningfulTransition(session));
    expect(canShowInterstitial(session, now)).toBe(false);
    const afterWindow = start + INTERSTITIAL_POLICY.windowMs + INTERSTITIAL_POLICY.cooldownMs;
    session = recordRewardedAd(session, afterWindow);
    expect(canShowInterstitial(session, afterWindow)).toBe(false);
    expect(canShowInterstitial(session, afterWindow + INTERSTITIAL_POLICY.rewardedSeparationMs)).toBe(true);
  });
});
