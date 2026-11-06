import type { BigValue } from '../game/BigNumber';

export type LeaderboardEntry = {
  id: string;
  name: string;
  worth: number | BigValue;
  avatar: string;
};

// Replace this export with a repository/API result when a backend is connected.
export const MOCK_LEADERS: LeaderboardEntry[] = [
  { id: 'mock-1', name: 'LunaCapital', worth: 8.6e15, avatar: '🌙' },
  { id: 'mock-2', name: 'MidasTouch', worth: 2.3e15, avatar: '👑' },
  { id: 'mock-3', name: 'CashNova', worth: 940e12, avatar: '🚀' },
  { id: 'mock-4', name: 'AzeriTycoon', worth: 110e12, avatar: '🔥' },
  { id: 'mock-5', name: 'GreenStacks', worth: 9.7e9, avatar: '📈' },
];
