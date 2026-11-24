import { useCallback, useState } from 'react';

import { useRewardedAd } from '../services/ads';
import { trackAdEvent } from '../services/ads/adAnalytics';

type Options = {
  placement: string;
  applyReward: () => boolean;
};

export function useRewardedAdPlacement({ placement, applyReward }: Options) {
  const { adsReady, rewardedStatus, showRewardedAd } = useRewardedAd();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const watch = useCallback(async () => {
    if (busy || !adsReady) return false;
    setBusy(true);
    setMessage('Preparing advertisement...');
    try {
      const earned = await showRewardedAd(placement);
      if (!earned) {
        setMessage('Advertisement unavailable or closed before completion. No reward was granted.');
        return false;
      }
      const applied = applyReward();
      if (!applied) {
        setMessage('The reward is already active or currently unavailable.');
        return false;
      }
      trackAdEvent('reward_applied', { format: 'rewarded', placement });
      setMessage('Reward applied successfully.');
      return true;
    } catch {
      setMessage('The advertisement failed. No reward was granted.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [adsReady, applyReward, busy, placement, showRewardedAd]);

  return { adsReady, busy, message, rewardedStatus, watch };
}

