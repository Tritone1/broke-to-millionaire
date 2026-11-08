import { CASH_REWARD_PLACEMENT, rewardedRequestOptions } from '../adRequest';

describe('rewarded advertisement requests', () => {
  it('associates the callback with the authenticated player', () => {
    const options = rewardedRequestOptions(
      'ae7e6db1-80f5-4c5d-aee0-38a8f01e1af3',
      ` ${CASH_REWARD_PLACEMENT} `,
    );

    expect(options.serverSideVerificationOptions).toEqual({
      userId: 'ae7e6db1-80f5-4c5d-aee0-38a8f01e1af3',
      customData: CASH_REWARD_PLACEMENT,
    });
  });

  it('uses a bounded fallback label for server logs', () => {
    expect(rewardedRequestOptions('player', '   ').serverSideVerificationOptions?.customData).toBe('reward');
    expect(rewardedRequestOptions('player', 'x'.repeat(200)).serverSideVerificationOptions?.customData).toHaveLength(128);
  });
});
