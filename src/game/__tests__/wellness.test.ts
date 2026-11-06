import { big, toNumber } from '../BigNumber';
import { BASE_LIFESPAN_YEARS, estimatedLifespanYears } from '../wellness';
import { createInitialLifeState, processGameMonth, useLifeStore } from '../../store/lifeStore';

describe('health, happiness, energy, and lifespan', () => {
  it('starts with a 100-year lifespan estimate', () => {
    expect(estimatedLifespanYears(createInitialLifeState())).toBe(BASE_LIFESPAN_YEARS);
  });

  it('raises lifespan for strong wellness and lowers it for poor wellness', () => {
    const initial = createInitialLifeState();
    const thriving = estimatedLifespanYears({ ...initial, health: 100, happiness: 100, stress: 0 });
    const unhappy = estimatedLifespanYears({ ...initial, happiness: 10 });
    const critical = estimatedLifespanYears({ ...initial, health: 5, happiness: 5, stress: 90 });
    expect(thriving).toBeGreaterThan(BASE_LIFESPAN_YEARS);
    expect(unhappy).toBeLessThan(BASE_LIFESPAN_YEARS);
    expect(critical).toBeLessThan(unhappy);
  });

  it('allows each wellness activity once per game month and applies its full cost and effects', () => {
    const initial = { ...createInitialLifeState(), money: big(100), energy: 40, health: 50, happiness: 50, stress: 50 };
    useLifeStore.setState({ ...initial, hydrated: true });
    expect(useLifeStore.getState().performWellnessAction('hobby')).toBe(true);
    expect(toNumber(useLifeStore.getState().money)).toBeCloseTo(60, 8);
    expect(useLifeStore.getState().energy).toBe(45);
    expect(useLifeStore.getState().happiness).toBe(62);
    expect(useLifeStore.getState().stress).toBe(38);
    expect(useLifeStore.getState().performWellnessAction('hobby')).toBe(false);
    useLifeStore.setState({ gameMonth: 1 });
    expect(useLifeStore.getState().performWellnessAction('hobby')).toBe(true);
  });

  it('makes exhaustion and dangerous stress worsen monthly health', () => {
    const rested = createInitialLifeState();
    const exhausted = { ...rested, energy: 10, stress: 90 };
    const restedHealth = processGameMonth(rested).health ?? rested.health;
    const exhaustedHealth = processGameMonth(exhausted).health ?? exhausted.health;
    expect(exhaustedHealth).toBeLessThan(restedHealth);
  });
});
