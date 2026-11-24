import { beginAdPresentation, endAdPresentation, isAdAppStateTransition, resetAdLifecycleForTests } from '../adLifecycle';

describe('native ad lifecycle', () => {
  beforeEach(resetAdLifecycleForTests);

  it('identifies background and resume events caused by an ad', () => {
    beginAdPresentation();
    expect(isAdAppStateTransition(1_000)).toBe(true);
    endAdPresentation(2_000);
    expect(isAdAppStateTransition(4_000)).toBe(true);
    expect(isAdAppStateTransition(4_501)).toBe(false);
  });

  it('does not identify an ordinary app background as an ad', () => {
    expect(isAdAppStateTransition(10_000)).toBe(false);
  });
});
