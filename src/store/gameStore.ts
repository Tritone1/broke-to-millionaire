import { create } from 'zustand';

import { ACHIEVEMENTS } from '../data/achievements';
import { BUSINESSES, businessById } from '../data/businesses';
import { DAILY_MISSIONS } from '../data/missions';
import { LIFESTYLE_ITEMS } from '../data/shop';
import { add, big, compare, multiply, subtract, toNumber, zero, type BigValue } from '../game/BigNumber';
import { tapValue, totalIncomePerSecond } from '../game/economy';
import {
  affordableQuantity,
  bulkBusinessCost,
  calculateOfflineEarnings,
  canAfford,
  managerCost,
  prestigePointsForLifetime,
  tapUpgradeCost,
  upgradeCost,
} from '../game/formulas';
import type { PersistedGameState, RandomEvent } from './types';

export const SAVE_VERSION = 1;

function localDateKey(timestamp = Date.now()): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function randomEventAt(now = Date.now()): number {
  return now + (2 + Math.random() * 3) * 60_000;
}

function emptyBusinessNumbers(): Record<string, number> {
  return Object.fromEntries(BUSINESSES.map((item) => [item.id, 0]));
}

function emptyBusinessBooleans(): Record<string, boolean> {
  return Object.fromEntries(BUSINESSES.map((item) => [item.id, false]));
}

export function createInitialPersistedState(now = Date.now()): PersistedGameState {
  return {
    saveVersion: SAVE_VERSION,
    money: zero(),
    lifetimeEarnings: zero(),
    totalSpent: zero(),
    businessOwned: emptyBusinessNumbers(),
    managers: emptyBusinessBooleans(),
    businessUpgrades: emptyBusinessNumbers(),
    tapLevel: 0,
    tapCount: 0,
    totalBusinessesBought: 0,
    legacyPoints: 0,
    ownedLifestyle: [],
    boostUntil: 0,
    dailyStats: { date: localDateKey(now), taps: 0, businesses: 0, earned: zero() },
    dailyStreak: 0,
    lastDailyClaim: null,
    claimedMissions: [],
    claimedAchievements: [],
    settings: { sound: true, haptics: true, language: 'en' },
    lastSavedAt: now,
    nextEventAt: randomEventAt(now),
  };
}

const EVENTS: Omit<RandomEvent, 'id'>[] = [
  { kind: 'crash', title: 'Market Crash!', description: 'Markets are falling. Lose 10% cash or protect it with an ad.' },
  { kind: 'lucky', title: 'Lucky Investment', description: 'One of your tiny bets just paid off. Collect a cash bonus!' },
  { kind: 'tax', title: 'Tax Audit', description: 'The tax office found you. Settle 6% of your cash.' },
  { kind: 'viral', title: 'Viral Trend', description: 'Your empire is trending. Enjoy 2× income for 60 seconds!' },
];

function selectRandomEvent(now: number): RandomEvent {
  const source = EVENTS[Math.floor(Math.random() * EVENTS.length)] ?? {
    kind: 'lucky',
    title: 'Lucky Investment',
    description: 'Collect a cash bonus!',
  };
  return { ...source, id: `${source.kind}-${now}` };
}

function ensureToday(state: PersistedGameState): Partial<PersistedGameState> {
  const today = localDateKey();
  if (state.dailyStats.date === today) return {};
  return {
    dailyStats: { date: today, taps: 0, businesses: 0, earned: zero() },
    claimedMissions: [],
  };
}

export type GameStore = PersistedGameState & {
  hydrated: boolean;
  offlineEarnings: BigValue;
  offlineSeconds: number;
  activeEvent: RandomEvent | null;
  celebrationNonce: number;
  purchaseMode: 1 | 10 | 'max';
  runtimeNow: number;
  hydrate: (saved: PersistedGameState | null) => void;
  tick: (elapsedMilliseconds: number, now: number) => void;
  tap: () => BigValue;
  buyTapUpgrade: () => boolean;
  buyBusiness: (id: string) => boolean;
  buyManager: (id: string) => boolean;
  buyBusinessUpgrade: (id: string) => boolean;
  buyLifestyle: (id: string) => boolean;
  setPurchaseMode: (mode: 1 | 10 | 'max') => void;
  claimOffline: (multiplier: number) => void;
  prepareOffline: (awayMilliseconds: number) => void;
  resolveEvent: (choice: 'accept' | 'avoid') => void;
  claimDaily: () => boolean;
  claimMission: (id: string) => boolean;
  claimAchievement: (id: string) => boolean;
  prestige: () => number;
  updateSettings: (settings: Partial<PersistedGameState['settings']>) => void;
  markSaved: (timestamp: number) => void;
  resetGame: () => void;
};

function economyFrom(state: PersistedGameState) {
  return {
    businessOwned: state.businessOwned,
    managers: state.managers,
    businessUpgrades: state.businessUpgrades,
    ownedLifestyle: state.ownedLifestyle,
    legacyPoints: state.legacyPoints,
    boostUntil: state.boostUntil,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialPersistedState(),
  hydrated: false,
  offlineEarnings: zero(),
  offlineSeconds: 0,
  activeEvent: null,
  celebrationNonce: 0,
  purchaseMode: 1,
  runtimeNow: Date.now(),

  hydrate: (saved) => {
    const now = Date.now();
    if (!saved) {
      set({ ...createInitialPersistedState(now), hydrated: true, nextEventAt: randomEventAt(now) });
      return;
    }
    const merged = { ...createInitialPersistedState(now), ...saved };
    const offline = calculateOfflineEarnings(totalIncomePerSecond(economyFrom(merged), saved.lastSavedAt), now - saved.lastSavedAt);
    set({
      ...merged,
      ...ensureToday(merged),
      hydrated: true,
      offlineEarnings: offline.earnings,
      offlineSeconds: offline.seconds,
      activeEvent: null,
      nextEventAt: randomEventAt(now),
      lastSavedAt: now,
      runtimeNow: now,
    });
  },

  tick: (elapsedMilliseconds, now) => {
    const state = get();
    if (!state.hydrated) return;
    const todayPatch = ensureToday(state);
    const income = multiply(totalIncomePerSecond(economyFrom(state), now), elapsedMilliseconds / 1000);
    const shouldEvent = now >= state.nextEventAt && state.activeEvent === null;
    set({
      ...todayPatch,
      money: add(state.money, income),
      lifetimeEarnings: add(state.lifetimeEarnings, income),
      dailyStats: {
        ...(Object.keys(todayPatch).length ? (todayPatch.dailyStats as PersistedGameState['dailyStats']) : state.dailyStats),
        earned: add(Object.keys(todayPatch).length ? zero() : state.dailyStats.earned, income),
      },
      activeEvent: shouldEvent ? selectRandomEvent(now) : state.activeEvent,
      nextEventAt: shouldEvent ? randomEventAt(now) : state.nextEventAt,
      runtimeNow: now,
    });
  },

  tap: () => {
    const state = get();
    const value = tapValue(economyFrom(state), state.tapLevel);
    const todayPatch = ensureToday(state);
    const daily = Object.keys(todayPatch).length ? (todayPatch.dailyStats as PersistedGameState['dailyStats']) : state.dailyStats;
    set({
      ...todayPatch,
      money: add(state.money, value),
      lifetimeEarnings: add(state.lifetimeEarnings, value),
      tapCount: state.tapCount + 1,
      dailyStats: { ...daily, taps: daily.taps + 1, earned: add(daily.earned, value) },
    });
    return value;
  },

  buyTapUpgrade: () => {
    const state = get();
    const cost = tapUpgradeCost(state.tapLevel);
    if (!canAfford(state.money, cost)) return false;
    set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), tapLevel: state.tapLevel + 1 });
    return true;
  },

  buyBusiness: (id) => {
    const state = get();
    const definition = businessById(id);
    const index = BUSINESSES.findIndex((item) => item.id === id);
    const previous = BUSINESSES[index - 1];
    if (previous && (state.businessOwned[previous.id] ?? 0) < 10) return false;
    const owned = state.businessOwned[id] ?? 0;
    const quantity = state.purchaseMode === 'max'
      ? affordableQuantity(definition, owned, state.money)
      : state.purchaseMode;
    if (quantity <= 0) return false;
    const cost = bulkBusinessCost(definition, owned, quantity);
    if (!canAfford(state.money, cost)) return false;
    const crossedMilestone = [25, 50, 100, 200].some((m) => owned < m && owned + quantity >= m);
    const dailyPatch = ensureToday(state);
    const daily = Object.keys(dailyPatch).length ? (dailyPatch.dailyStats as PersistedGameState['dailyStats']) : state.dailyStats;
    set({
      ...dailyPatch,
      money: subtract(state.money, cost),
      totalSpent: add(state.totalSpent, cost),
      businessOwned: { ...state.businessOwned, [id]: owned + quantity },
      totalBusinessesBought: state.totalBusinessesBought + quantity,
      dailyStats: { ...daily, businesses: daily.businesses + quantity },
      celebrationNonce: crossedMilestone ? state.celebrationNonce + 1 : state.celebrationNonce,
    });
    return true;
  },

  buyManager: (id) => {
    const state = get();
    if (state.managers[id]) return false;
    const cost = managerCost(businessById(id));
    if (!canAfford(state.money, cost)) return false;
    set({ money: subtract(state.money, cost), totalSpent: add(state.totalSpent, cost), managers: { ...state.managers, [id]: true } });
    return true;
  },

  buyBusinessUpgrade: (id) => {
    const state = get();
    const level = state.businessUpgrades[id] ?? 0;
    const cost = upgradeCost(businessById(id), level);
    if (!canAfford(state.money, cost)) return false;
    set({
      money: subtract(state.money, cost),
      totalSpent: add(state.totalSpent, cost),
      businessUpgrades: { ...state.businessUpgrades, [id]: level + 1 },
    });
    return true;
  },

  buyLifestyle: (id) => {
    const state = get();
    const item = LIFESTYLE_ITEMS.find((entry) => entry.id === id);
    if (!item || state.ownedLifestyle.includes(id) || !canAfford(state.money, big(item.cost))) return false;
    set({
      money: subtract(state.money, item.cost),
      totalSpent: add(state.totalSpent, item.cost),
      ownedLifestyle: [...state.ownedLifestyle, id],
      celebrationNonce: state.celebrationNonce + 1,
    });
    return true;
  },

  setPurchaseMode: (purchaseMode) => set({ purchaseMode }),

  claimOffline: (multiplier) => {
    const state = get();
    const reward = multiply(state.offlineEarnings, multiplier);
    set({
      money: add(state.money, reward),
      lifetimeEarnings: add(state.lifetimeEarnings, reward),
      offlineEarnings: zero(),
      offlineSeconds: 0,
      celebrationNonce: compare(reward, 0) > 0 ? state.celebrationNonce + 1 : state.celebrationNonce,
    });
  },

  prepareOffline: (awayMilliseconds) => {
    const state = get();
    const offline = calculateOfflineEarnings(totalIncomePerSecond(economyFrom(state)), awayMilliseconds);
    if (offline.seconds < 5 || compare(offline.earnings, 0) <= 0) return;
    set({ offlineEarnings: offline.earnings, offlineSeconds: offline.seconds });
  },

  resolveEvent: (choice) => {
    const state = get();
    const event = state.activeEvent;
    if (!event) return;
    let money = state.money;
    let boostUntil = state.boostUntil;
    if (event.kind === 'crash' && choice === 'accept') money = multiply(money, 0.9);
    if (event.kind === 'tax') money = multiply(money, 0.94);
    if (event.kind === 'lucky') {
      const bonus = multiply(totalIncomePerSecond(economyFrom(state)), 120);
      const floorBonus = big(500);
      money = add(money, compare(bonus, floorBonus) > 0 ? bonus : floorBonus);
    }
    if (event.kind === 'viral') boostUntil = Date.now() + 60_000;
    set({ money, boostUntil, activeEvent: null });
  },

  claimDaily: () => {
    const state = get();
    const today = localDateKey();
    if (state.lastDailyClaim === today) return false;
    const yesterday = localDateKey(Date.now() - 86_400_000);
    const nextStreak = state.lastDailyClaim === yesterday ? (state.dailyStreak % 7) + 1 : 1;
    const reward = 500 * 3 ** (nextStreak - 1);
    set({
      money: add(state.money, reward),
      lifetimeEarnings: add(state.lifetimeEarnings, reward),
      lastDailyClaim: today,
      dailyStreak: nextStreak,
      celebrationNonce: state.celebrationNonce + 1,
    });
    return true;
  },

  claimMission: (id) => {
    const state = get();
    const mission = DAILY_MISSIONS.find((item) => item.id === id);
    if (!mission || state.claimedMissions.includes(id)) return false;
    const progress = mission.kind === 'taps'
      ? state.dailyStats.taps
      : mission.kind === 'businesses'
        ? state.dailyStats.businesses
        : toNumber(state.dailyStats.earned);
    if (progress < mission.target) return false;
    set({
      money: add(state.money, mission.reward),
      lifetimeEarnings: add(state.lifetimeEarnings, mission.reward),
      claimedMissions: [...state.claimedMissions, id],
      celebrationNonce: state.celebrationNonce + 1,
    });
    return true;
  },

  claimAchievement: (id) => {
    const state = get();
    const achievement = ACHIEVEMENTS.find((item) => item.id === id);
    if (!achievement || state.claimedAchievements.includes(id)) return false;
    const netWorth = add(state.money, state.totalSpent);
    const progress = achievement.kind === 'netWorth'
      ? toNumber(netWorth)
      : achievement.kind === 'businesses'
        ? Object.values(state.businessOwned).reduce((total, value) => total + value, 0)
        : toNumber(state.lifetimeEarnings);
    if (progress < achievement.target) return false;
    set({
      money: add(state.money, achievement.reward),
      lifetimeEarnings: add(state.lifetimeEarnings, achievement.reward),
      claimedAchievements: [...state.claimedAchievements, id],
      celebrationNonce: state.celebrationNonce + 1,
    });
    return true;
  },

  prestige: () => {
    const state = get();
    const potential = prestigePointsForLifetime(state.lifetimeEarnings);
    const gained = Math.max(0, potential - state.legacyPoints);
    if (gained <= 0) return 0;
    const fresh = createInitialPersistedState();
    set({
      ...fresh,
      hydrated: true,
      legacyPoints: state.legacyPoints + gained,
      settings: state.settings,
      claimedAchievements: state.claimedAchievements,
      celebrationNonce: state.celebrationNonce + 1,
    });
    return gained;
  },

  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  markSaved: (lastSavedAt) => set({ lastSavedAt }),
  resetGame: () => set({ ...createInitialPersistedState(), hydrated: true, offlineEarnings: zero(), offlineSeconds: 0, activeEvent: null }),
}));

export function selectPersistedState(state: GameStore): PersistedGameState {
  return {
    saveVersion: state.saveVersion,
    money: state.money,
    lifetimeEarnings: state.lifetimeEarnings,
    totalSpent: state.totalSpent,
    businessOwned: state.businessOwned,
    managers: state.managers,
    businessUpgrades: state.businessUpgrades,
    tapLevel: state.tapLevel,
    tapCount: state.tapCount,
    totalBusinessesBought: state.totalBusinessesBought,
    legacyPoints: state.legacyPoints,
    ownedLifestyle: state.ownedLifestyle,
    boostUntil: state.boostUntil,
    dailyStats: state.dailyStats,
    dailyStreak: state.dailyStreak,
    lastDailyClaim: state.lastDailyClaim,
    claimedMissions: state.claimedMissions,
    claimedAchievements: state.claimedAchievements,
    settings: state.settings,
    lastSavedAt: state.lastSavedAt,
    nextEventAt: state.nextEventAt,
  };
}
