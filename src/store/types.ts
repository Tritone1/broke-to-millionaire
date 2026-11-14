import type { BigValue } from '../game/BigNumber';
import type { Language } from '../data/i18n';

export type RandomEventKind = 'crash' | 'lucky' | 'tax' | 'viral';

export type RandomEvent = {
  id: string;
  kind: RandomEventKind;
  title: string;
  description: string;
};

export type DailyStats = {
  date: string;
  taps: number;
  businesses: number;
  earned: BigValue;
};

export type GameSettings = {
  sound: boolean;
  haptics: boolean;
  language: Language;
  languageChosen: boolean;
};

export type PersistedGameState = {
  saveVersion: number;
  money: BigValue;
  lifetimeEarnings: BigValue;
  totalSpent: BigValue;
  businessOwned: Record<string, number>;
  managers: Record<string, boolean>;
  businessUpgrades: Record<string, number>;
  tapLevel: number;
  tapCount: number;
  totalBusinessesBought: number;
  legacyPoints: number;
  ownedLifestyle: string[];
  boostUntil: number;
  dailyStats: DailyStats;
  dailyStreak: number;
  lastDailyClaim: string | null;
  claimedMissions: string[];
  claimedAchievements: string[];
  settings: GameSettings;
  lastSavedAt: number;
  nextEventAt: number;
};
