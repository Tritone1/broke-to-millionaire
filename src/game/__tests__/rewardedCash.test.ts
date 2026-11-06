import { toNumber } from '../BigNumber';
import { createInitialLifeState, useLifeStore } from '../../store/lifeStore';

describe('rewarded advertisement cash', () => {
  beforeEach(() => {
    useLifeStore.setState({ ...createInitialLifeState(1_000), hydrated: true });
  });

  it('credits exactly $1,000 of virtual cash after a completed reward', () => {
    const before = useLifeStore.getState();
    expect(toNumber(before.money)).toBe(0);

    before.claimRewardedCash();

    const after = useLifeStore.getState();
    expect(toNumber(after.money)).toBe(1_000);
    expect(toNumber(after.lifetimeEarnings)).toBe(1_000);
  });
});
