import { BUSINESSES } from '../data/businesses';
import { LIFESTYLE_ITEMS } from '../data/shop';
import { multiply, type BigValue } from './BigNumber';
import {
  businessIncomePerSecond,
  legacyMultiplier,
  lifestyleMultiplier,
  sum,
} from './formulas';

export type EconomySnapshot = {
  businessOwned: Record<string, number>;
  managers: Record<string, boolean>;
  businessUpgrades: Record<string, number>;
  ownedLifestyle: string[];
  legacyPoints: number;
  boostUntil: number;
};

export function totalIncomePerSecond(snapshot: EconomySnapshot, now = Date.now()): BigValue {
  const businessIncome = sum(
    BUSINESSES.map((definition) =>
      businessIncomePerSecond(
        definition,
        snapshot.businessOwned[definition.id] ?? 0,
        snapshot.managers[definition.id] ?? false,
        snapshot.businessUpgrades[definition.id] ?? 0,
      ),
    ),
  );
  const lifestyleBonuses = LIFESTYLE_ITEMS.filter((item) => snapshot.ownedLifestyle.includes(item.id)).map(
    (item) => item.bonus,
  );
  const eventMultiplier = now < snapshot.boostUntil ? 2 : 1;
  return multiply(
    businessIncome,
    legacyMultiplier(snapshot.legacyPoints) * lifestyleMultiplier(lifestyleBonuses) * eventMultiplier,
  );
}

export function tapValue(snapshot: EconomySnapshot, tapLevel: number): BigValue {
  const lifestyleBonuses = LIFESTYLE_ITEMS.filter((item) => snapshot.ownedLifestyle.includes(item.id)).map(
    (item) => item.bonus,
  );
  return multiply(
    2 ** (tapLevel + 1),
    legacyMultiplier(snapshot.legacyPoints) * lifestyleMultiplier(lifestyleBonuses),
  );
}
