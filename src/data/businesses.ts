export type BusinessTier = 1 | 2 | 3 | 4 | 5 | 6;

export type BusinessDefinition = {
  id: string;
  name: string;
  emoji: string;
  tier: BusinessTier;
  tierName: string;
  baseCost: number;
  baseIncome: number;
  cycleSeconds: number;
};

const business = (
  id: string,
  name: string,
  emoji: string,
  tier: BusinessTier,
  tierName: string,
  baseCost: number,
  baseIncome: number,
  cycleSeconds: number,
): BusinessDefinition => ({ id, name, emoji, tier, tierName, baseCost, baseIncome, cycleSeconds });

export const BUSINESSES: BusinessDefinition[] = [
  business('newspaper', 'Newspaper Route', '🗞️', 1, 'Street Hustler', 10, 0.65, 2),
  business('lemonade', 'Lemonade Stand', '🍋', 1, 'Street Hustler', 120, 5, 3),
  business('carWash', 'Car Wash', '🚗', 1, 'Street Hustler', 1_200, 35, 4),
  business('cafe', 'Cafe', '☕', 2, 'Small Business', 12_000, 180, 5),
  business('barbershop', 'Barbershop', '✂️', 2, 'Small Business', 48_000, 600, 6),
  business('taxi', 'Taxi', '🚕', 2, 'Small Business', 180_000, 1_900, 7),
  business('miniMarket', 'Mini Market', '🏪', 2, 'Small Business', 650_000, 6_000, 8),
  business('restaurant', 'Restaurant', '🍽️', 3, 'Entrepreneur', 2_500_000, 20_000, 9),
  business('realEstate', 'Real Estate', '🏘️', 3, 'Entrepreneur', 9_000_000, 65_000, 10),
  business('onlineStore', 'Online Store', '📦', 3, 'Entrepreneur', 32_000_000, 210_000, 11),
  business('hotel', 'Hotel', '🏨', 4, 'Tycoon', 140_000_000, 780_000, 12),
  business('factory', 'Factory', '🏭', 4, 'Tycoon', 550_000_000, 2_800_000, 13),
  business('techStartup', 'Tech Startup', '💻', 4, 'Tycoon', 2_200_000_000, 10_000_000, 14),
  business('stocks', 'Stock Portfolio', '📈', 4, 'Tycoon', 9_000_000_000, 38_000_000, 15),
  business('airline', 'Airline', '✈️', 5, 'Mogul', 40_000_000_000, 150_000_000, 16),
  business('island', 'Private Island', '🏝️', 5, 'Mogul', 180_000_000_000, 620_000_000, 17),
  business('football', 'Football Club', '⚽', 5, 'Mogul', 850_000_000_000, 2_600_000_000, 18),
  business('bank', 'Bank', '🏦', 5, 'Mogul', 4_000_000_000_000, 11_000_000_000, 20),
  business('spaceTourism', 'Space Tourism', '🚀', 6, 'Beyond', 22_000_000_000_000, 55_000_000_000, 22),
  business('marsColony', 'Mars Colony', '🔴', 6, 'Beyond', 130_000_000_000_000, 300_000_000_000, 24),
  business('country', 'Buy a Country', '🌍', 6, 'Beyond', 900_000_000_000_000, 1_800_000_000_000, 26),
];

export const MILESTONES = [25, 50, 100, 200] as const;

export function businessById(id: string): BusinessDefinition {
  const found = BUSINESSES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown business: ${id}`);
  return found;
}
