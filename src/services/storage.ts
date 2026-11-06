import AsyncStorage from '@react-native-async-storage/async-storage';

import { big, zero } from '../game/BigNumber';
import { createInitialPersistedState, SAVE_VERSION } from '../store/gameStore';
import type { PersistedGameState } from '../store/types';

const SAVE_KEY = '@rich-simulator-idle/save';

type LegacySave = Partial<PersistedGameState> & { saveVersion?: number; cash?: number };

function migrate(raw: LegacySave): PersistedGameState {
  const defaults = createInitialPersistedState();
  if (!raw.saveVersion || raw.saveVersion < 1) {
    return {
      ...defaults,
      ...raw,
      saveVersion: SAVE_VERSION,
      money: raw.money ? big(raw.money) : raw.cash ? big(raw.cash) : zero(),
      lifetimeEarnings: raw.lifetimeEarnings ? big(raw.lifetimeEarnings) : zero(),
      totalSpent: raw.totalSpent ? big(raw.totalSpent) : zero(),
    };
  }
  return { ...defaults, ...raw, saveVersion: SAVE_VERSION } as PersistedGameState;
}

export async function loadGame(): Promise<PersistedGameState | null> {
  try {
    const serialized = await AsyncStorage.getItem(SAVE_KEY);
    if (!serialized) return null;
    return migrate(JSON.parse(serialized) as LegacySave);
  } catch {
    return null;
  }
}

export async function saveGame(state: PersistedGameState): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage failures are intentionally non-fatal; the next autosave retries.
  }
}

export async function clearGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch {
    // Resetting in-memory progress still leaves the game usable.
  }
}
