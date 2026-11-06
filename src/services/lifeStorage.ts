import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrateLifeSave } from '../game/lifeMigration';
import { createInitialLifeState, LIFE_SAVE_VERSION, type LifePersistedState, type LifeSettings } from '../store/lifeStore';

const LEGACY_SAVE_KEY = '@rich-simulator/life-save';
const SLOT_PREFIX = '@rich-simulator/life-slot-';
const GLOBAL_SETTINGS_KEY = '@rich-simulator/global-settings';
export type SlotId = 1 | 2 | 3;

function slotKey(slot: SlotId) {
  return `${SLOT_PREFIX}${slot}`;
}

async function migrateLegacySlot(): Promise<void> {
  const [slotOne, legacy] = await Promise.all([AsyncStorage.getItem(slotKey(1)), AsyncStorage.getItem(LEGACY_SAVE_KEY)]);
  if (slotOne || !legacy) return;
  try {
    const migrated = migrateLifeSave(JSON.parse(legacy));
    await AsyncStorage.setItem(slotKey(1), JSON.stringify(migrated));
    await AsyncStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    // A malformed legacy save is ignored; new slots remain usable.
  }
}

export async function loadLifeSlot(slot: SlotId): Promise<LifePersistedState | null> {
  try {
    await migrateLegacySlot();
    const serialized = await AsyncStorage.getItem(slotKey(slot));
    return serialized ? migrateLifeSave(JSON.parse(serialized)) : null;
  } catch {
    return null;
  }
}

export async function saveLifeSlot(slot: SlotId, state: LifePersistedState): Promise<void> {
  try {
    await AsyncStorage.setItem(slotKey(slot), JSON.stringify({ ...state, saveVersion: LIFE_SAVE_VERSION }));
  } catch {
    // A later autosave retries without interrupting gameplay.
  }
}

export async function deleteLifeSlot(slot: SlotId): Promise<void> {
  try {
    await AsyncStorage.removeItem(slotKey(slot));
  } catch {
    // UI is refreshed and can retry the deletion.
  }
}

export async function listLifeSlots(): Promise<(LifePersistedState | null)[]> {
  await migrateLegacySlot();
  return Promise.all(([1, 2, 3] as SlotId[]).map(loadLifeSlot));
}

export async function loadGlobalSettings(): Promise<LifeSettings> {
  try {
    const raw = await AsyncStorage.getItem(GLOBAL_SETTINGS_KEY);
    return raw ? { ...createInitialLifeState().settings, ...(JSON.parse(raw) as Partial<LifeSettings>) } : createInitialLifeState().settings;
  } catch {
    return createInitialLifeState().settings;
  }
}

export async function saveGlobalSettings(settings: LifeSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings remain active for the current session.
  }
}

export const loadLifeGame = () => loadLifeSlot(1);
export const saveLifeGame = (state: LifePersistedState) => saveLifeSlot(1, state);
export const clearLifeGame = () => deleteLifeSlot(1);
