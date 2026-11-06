export type MissionKind = 'taps' | 'businesses' | 'earn';

export type MissionDefinition = {
  id: string;
  kind: MissionKind;
  title: string;
  target: number;
  reward: number;
};

export const DAILY_MISSIONS: MissionDefinition[] = [
  { id: 'tap200', kind: 'taps', title: 'Tap 200 times', target: 200, reward: 2_500 },
  { id: 'buy10', kind: 'businesses', title: 'Buy 10 businesses', target: 10, reward: 7_500 },
  { id: 'earn50k', kind: 'earn', title: 'Earn $50K today', target: 50_000, reward: 15_000 },
];
