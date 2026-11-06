import { MILESTONES, type BusinessDefinition } from '../data/businesses';
import { OFFLINE_CAP_SECONDS } from './config';
import {
  add,
  big,
  compare,
  divide,
  fromLog10,
  log10,
  multiply,
  pow,
  subtract,
  toNumber,
  zero,
  type BigValue,
} from './BigNumber';

export const COST_GROWTH = 1.15;

export function businessCost(definition: BusinessDefinition, owned: number): BigValue {
  return fromLog10(Math.log10(definition.baseCost) + owned * Math.log10(COST_GROWTH));
}

export function bulkBusinessCost(definition: BusinessDefinition, owned: number, quantity: number): BigValue {
  if (quantity <= 0) return zero();
  const first = businessCost(definition, owned);
  const growth = big(COST_GROWTH);
  const numerator = subtract(pow(growth, quantity), 1);
  return multiply(first, divide(numerator, COST_GROWTH - 1));
}

export function affordableQuantity(definition: BusinessDefinition, owned: number, money: BigValue): number {
  const firstCost = toNumber(businessCost(definition, owned));
  const available = toNumber(money);
  if (available < firstCost) return 0;
  if (available === Number.MAX_VALUE || firstCost === Number.MAX_VALUE) {
    const geometricLog = log10(money) + Math.log10(COST_GROWTH - 1) - log10(businessCost(definition, owned));
    return Math.max(1, Math.floor(geometricLog / Math.log10(COST_GROWTH)));
  }
  return Math.max(0, Math.floor(Math.log(1 + (available * (COST_GROWTH - 1)) / firstCost) / Math.log(COST_GROWTH)));
}

export function milestoneMultiplier(owned: number): number {
  return 2 ** MILESTONES.filter((milestone) => owned >= milestone).length;
}

export function businessIncomePerSecond(
  definition: BusinessDefinition,
  owned: number,
  hasManager: boolean,
  upgradeLevel: number,
): BigValue {
  const multiplier = milestoneMultiplier(owned) * 2 ** upgradeLevel * (hasManager ? 2 : 1);
  return big(definition.baseIncome * owned * multiplier);
}

export function managerCost(definition: BusinessDefinition): BigValue {
  return big(definition.baseCost * 50);
}

export function upgradeCost(definition: BusinessDefinition, level: number): BigValue {
  return multiply(definition.baseCost * 200, fromLog10(level));
}

export function tapUpgradeCost(level: number): BigValue {
  return fromLog10(Math.log10(25) + level * Math.log10(3));
}

export function prestigePointsForLifetime(lifetimeEarnings: BigValue): number {
  const amount = toNumber(lifetimeEarnings);
  if (amount < 1_000_000) return 0;
  if (amount === Number.MAX_VALUE) {
    return Math.floor(10 ** Math.min(15, (log10(lifetimeEarnings) - 6) / 2));
  }
  return Math.floor(Math.sqrt(amount / 1_000_000));
}

export function legacyMultiplier(points: number): number {
  return 1 + points * 0.05;
}

export function lifestyleMultiplier(bonuses: number[]): number {
  return 1 + bonuses.reduce((total, bonus) => total + bonus, 0);
}

export function calculateOfflineEarnings(
  incomePerSecond: BigValue,
  awayMilliseconds: number,
): { earnings: BigValue; seconds: number } {
  const validElapsed = Number.isFinite(awayMilliseconds) && awayMilliseconds >= 0 && awayMilliseconds <= 365 * 24 * 60 * 60 * 1_000;
  const seconds = validElapsed ? Math.min(OFFLINE_CAP_SECONDS, awayMilliseconds / 1_000) : 0;
  return { earnings: multiply(incomePerSecond, seconds), seconds };
}

export function canAfford(money: BigValue, cost: BigValue): boolean {
  return compare(money, cost) >= 0;
}

export function sum(values: BigValue[]): BigValue {
  return values.reduce<BigValue>((total, value) => add(total, value), zero());
}
