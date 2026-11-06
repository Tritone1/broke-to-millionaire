import { BUSINESSES } from '../../data/businesses';
import { formatBig, toNumber } from '../BigNumber';
import {
  bulkBusinessCost,
  businessCost,
  calculateOfflineEarnings,
  prestigePointsForLifetime,
} from '../formulas';

describe('business costs', () => {
  const newspaper = BUSINESSES[0]!;

  it('uses baseCost × 1.15^owned', () => {
    expect(toNumber(businessCost(newspaper, 0))).toBeCloseTo(10, 8);
    expect(toNumber(businessCost(newspaper, 10))).toBeCloseTo(10 * 1.15 ** 10, 8);
  });

  it('sums a bulk purchase as a geometric series', () => {
    const direct = Array.from({ length: 10 }, (_, index) => 10 * 1.15 ** index).reduce((sum, value) => sum + value, 0);
    expect(toNumber(bulkBusinessCost(newspaper, 0, 10))).toBeCloseTo(direct, 7);
  });
});

describe('offline earnings', () => {
  it('multiplies timestamp duration by per-second income', () => {
    const result = calculateOfflineEarnings('2.5|2', 20_000);
    expect(result.seconds).toBe(20);
    expect(toNumber(result.earnings)).toBeCloseTo(5_000);
  });

  it('caps time away at one game month', () => {
    const result = calculateOfflineEarnings('1|2', 24 * 60 * 60 * 1_000);
    expect(result.seconds).toBe(60);
    expect(toNumber(result.earnings)).toBe(6_000);
  });
});

describe('prestige formula', () => {
  it('awards no points below one million lifetime earnings', () => {
    expect(prestigePointsForLifetime('9.99999|5')).toBe(0);
  });

  it('uses floor(sqrt(lifetime / 1M))', () => {
    expect(prestigePointsForLifetime('1|6')).toBe(1);
    expect(prestigePointsForLifetime('2.5|7')).toBe(5);
    expect(prestigePointsForLifetime('1|8')).toBe(10);
  });
});

describe('big number formatting', () => {
  it.each([
    [1_500, '1.5K'],
    [2_300_000, '2.3M'],
    [4_700_000_000, '4.7B'],
    [1_200_000_000_000, '1.2T'],
    [1e15, '1aa'],
    [1e18, '1ab'],
    [1e21, '1ac'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatBig(value)).toBe(expected);
  });
});
