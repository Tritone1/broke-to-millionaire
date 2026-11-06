export type LifestyleItem = {
  id: string;
  name: string;
  emoji: string;
  category: 'Car' | 'Watch' | 'Mansion' | 'Yacht' | 'Jet';
  cost: number;
  bonus: number;
  monthlyUpkeep: number;
  description: string;
};

export const LIFESTYLE_ITEMS: LifestyleItem[] = [
  { id: 'sportscar', name: 'Velocity GT', emoji: '🏎️', category: 'Car', cost: 250_000, bonus: 0.02, monthlyUpkeep: 1_500, description: '+2% all income' },
  { id: 'watch', name: 'Golden Chronograph', emoji: '⌚', category: 'Watch', cost: 2_000_000, bonus: 0.03, monthlyUpkeep: 0, description: '+3% all income' },
  { id: 'mansion', name: 'Skyline Mansion', emoji: '🏰', category: 'Mansion', cost: 25_000_000, bonus: 0.05, monthlyUpkeep: 35_000, description: '+5% all income' },
  { id: 'yacht', name: 'The Dividend', emoji: '🛥️', category: 'Yacht', cost: 500_000_000, bonus: 0.08, monthlyUpkeep: 250_000, description: '+8% all income' },
  { id: 'jet', name: 'Legacy One', emoji: '🛩️', category: 'Jet', cost: 10_000_000_000, bonus: 0.12, monthlyUpkeep: 2_000_000, description: '+12% all income' },
];
