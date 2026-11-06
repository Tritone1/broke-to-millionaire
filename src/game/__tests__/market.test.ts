import { advanceMarket, averagePriceAfterBuy, createMarketSnapshot, positionProfitLoss } from '../marketEngine';

describe('broker calculations', () => {
  it('calculates weighted average buy price and unrealized P/L', () => {
    const average = averagePriceAfterBuy(10, 20, 5, 50);
    expect(average).toBe(30);
    expect(positionProfitLoss(15, average, 42)).toBe(180);
  });

  it('produces deterministic positive prices and bounded history', () => {
    let first = createMarketSnapshot(777);
    let second = createMarketSnapshot(777);
    for (let index = 0; index < 50; index += 1) {
      first = advanceMarket(first, index * 2_000);
      second = advanceMarket(second, index * 2_000);
    }
    expect(first.prices).toEqual(second.prices);
    expect(Object.values(first.prices).every((price) => price > 0)).toBe(true);
    expect(Object.values(first.history).every((history) => history.length <= 36)).toBe(true);
  });
});
