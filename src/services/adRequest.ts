import type { RequestOptions } from 'react-native-google-mobile-ads';

export const CASH_REWARD_PLACEMENT = 'Free $1,000 virtual cash';

export function rewardedRequestOptions(userId: string, placement: string): RequestOptions {
  return {
    requestNonPersonalizedAdsOnly: false,
    serverSideVerificationOptions: {
      userId,
      customData: placement.trim().slice(0, 128) || 'reward',
    },
  };
}
