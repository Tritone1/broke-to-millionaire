import { createInitialLifeState, useLifeStore } from '../../store/lifeStore';

describe('rewarded ad gameplay rewards', () => {
  const now = 1_000_000;

  beforeEach(() => {
    useLifeStore.setState({ ...createInitialLifeState(now), hydrated: true, runtimeNow: now });
  });

  it('caps energy at 100 and enforces the persisted cooldown', () => {
    useLifeStore.setState({ energy: 90 });
    expect(useLifeStore.getState().grantAdEnergyReward(now)).toBe(true);
    expect(useLifeStore.getState().energy).toBe(100);
    expect(useLifeStore.getState().grantAdEnergyReward(now + 1)).toBe(false);
    expect(useLifeStore.getState().adRewardCooldowns.energy).toBe(now + 10 * 60_000);
  });

  it('grants one salary multiplier and consumes it on the next valid shift', () => {
    useLifeStore.setState({ jobId: 'courier', energy: 100 });
    expect(useLifeStore.getState().grantAdSalaryBonus(now)).toBe(true);
    expect(useLifeStore.getState().grantAdSalaryBonus(now + 1)).toBe(false);
    expect(useLifeStore.getState().nextWorkShiftMultiplier).toBe(1.25);
    expect(useLifeStore.getState().workHard()).toBe(true);
    expect(useLifeStore.getState().nextWorkShiftMultiplier).toBe(1);
  });

  it('queues only one opportunity and consumes it when the game ticks', () => {
    useLifeStore.setState({ nextLifeEventAt: now + 999_999, activeLifeEvent: null });
    expect(useLifeStore.getState().grantAdSpecialOpportunity(now)).toBe(true);
    expect(useLifeStore.getState().grantAdSpecialOpportunity(now + 1)).toBe(false);
    useLifeStore.getState().tick(100, now + 100);
    expect(useLifeStore.getState().extraOpportunityCredits).toBe(0);
    expect(useLifeStore.getState().activeLifeEvent).not.toBeNull();
  });
});
