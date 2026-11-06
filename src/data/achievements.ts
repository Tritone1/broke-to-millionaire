export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  kind: 'netWorth' | 'businesses' | 'lifetime';
  target: number;
  reward: number;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'firstThousand', title: 'Four Figures', description: 'Reach $1K net worth', kind: 'netWorth', target: 1_000, reward: 500 },
  { id: 'property10', title: 'Own 10 Properties', description: 'Own 10 businesses', kind: 'businesses', target: 10, reward: 2_000 },
  { id: 'firstMillion', title: 'First Million', description: 'Reach $1M net worth', kind: 'netWorth', target: 1_000_000, reward: 50_000 },
  { id: 'empire100', title: 'Business Empire', description: 'Own 100 businesses', kind: 'businesses', target: 100, reward: 1_000_000 },
  { id: 'billionaire', title: 'Billionaire', description: 'Reach $1B net worth', kind: 'netWorth', target: 1_000_000_000, reward: 25_000_000 },
  { id: 'trillionClub', title: 'Trillion Club', description: 'Earn $1T all-time', kind: 'lifetime', target: 1_000_000_000_000, reward: 1_000_000_000 },
];
