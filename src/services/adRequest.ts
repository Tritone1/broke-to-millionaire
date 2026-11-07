import type { RequestOptions } from 'react-native-google-mobile-ads';

export function rewardedRequestOptions(userId: string, placement: string): RequestOptions {
  return {
    requestNonPersonalizedAdsOnly: false,
    serverSideVerificationOptions: {
      userId,
      customData: placement.trim().slice(0, 128) || 'reward',
    },
  };
}
