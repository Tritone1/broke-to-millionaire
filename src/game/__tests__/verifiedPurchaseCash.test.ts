import { createInitialLifeState, useLifeStore } from '../../store/lifeStore';
import { toNumber } from '../BigNumber';

describe('verified in-app purchase cash', () => {
  beforeEach(() => {
    useLifeStore.setState({ ...createInitialLifeState(1_000), hydrated: true });
  });

  it('credits a positive server-verified cash grant once it is claimed', () => {
    useLifeStore.getState().applyVerifiedCashDelta(25_000);

    const state = useLifeStore.getState();
    expect(toNumber(state.money)).toBe(25_000);
    expect(toNumber(state.lifetimeEarnings)).toBe(25_000);
  });

  it('rejects invalid or zero client amounts', () => {
    const store = useLifeStore.getState();
    store.applyVerifiedCashDelta(0);
    store.applyVerifiedCashDelta(1.5);

    expect(toNumber(useLifeStore.getState().money)).toBe(0);
  });

  it('applies a verified refund without taking cash below zero or reducing lifetime earnings', () => {
    const store = useLifeStore.getState();
    store.applyVerifiedCashDelta(5_000);
    store.applyVerifiedCashDelta(-7_500);

    const state = useLifeStore.getState();
    expect(toNumber(state.money)).toBe(0);
    expect(toNumber(state.lifetimeEarnings)).toBe(5_000);
  });
});
