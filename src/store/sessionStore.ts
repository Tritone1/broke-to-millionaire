import { create } from 'zustand';

import { formatBig } from '../game/BigNumber';
import { isLanguage, type Language } from '../data/i18n';
import { LOCATION_ART } from '../data/artManifest';
import { preloadAvatarAssets } from '../services/avatarAssets';
import { preloadImageSource } from '../services/imageAssetCache';
import { deleteLifeSlot, listLifeSlots, loadGlobalSettings, loadLifeSlot, saveGlobalSettings, saveLifeSlot, type SlotId } from '../services/lifeStorage';
import { calculateLifeNetWorth, selectLifePersistedState, useLifeStore, type CharacterProfile, type LifePersistedState, type LifeSettings } from './lifeStore';

export type SlotSummary = { slot: SlotId; name: string; age: number; netWorth: string; playSeconds: number; savedAt: number };
type SessionPhase = 'boot' | 'language' | 'menu' | 'setup' | 'game' | 'settings' | 'help';

type SessionStore = {
  phase: SessionPhase;
  activeSlot: SlotId | null;
  setupSlot: SlotId | null;
  slots: Partial<Record<SlotId, SlotSummary>>;
  settings: LifeSettings;
  bootstrap: () => Promise<void>;
  refreshSlots: () => Promise<void>;
  openSetup: (slot: SlotId) => void;
  cancelSetup: () => void;
  beginGame: (character: CharacterProfile) => Promise<void>;
  continueSlot: (slot: SlotId) => Promise<void>;
  continueLatest: () => Promise<void>;
  deleteSlot: (slot: SlotId) => Promise<void>;
  returnToMenu: () => Promise<void>;
  openPanel: (phase: 'settings' | 'help') => void;
  closePanel: () => void;
  updateSettings: (patch: Partial<LifeSettings>) => Promise<void>;
  chooseLanguage: (language: Language) => Promise<void>;
};

async function preloadLifePresentation(state: Pick<LifePersistedState, 'character' | 'housing'>): Promise<void> {
  const location = state.housing.id === 'homeless' ? LOCATION_ART.street : LOCATION_ART.apartment;
  await Promise.all([
    preloadAvatarAssets(state.character, 'portrait'),
    preloadAvatarAssets(state.character, 'full'),
    preloadImageSource(location.source),
  ]);
}

function summaries(states: (LifePersistedState | null)[]): Partial<Record<SlotId, SlotSummary>> {
  const result: Partial<Record<SlotId, SlotSummary>> = {};
  states.forEach((state, index) => {
    if (!state) return;
    const slot = (index + 1) as SlotId;
    result[slot] = { slot, name: state.character.name, age: state.age, netWorth: formatBig(calculateLifeNetWorth(state), 2), playSeconds: state.totalPlaySeconds, savedAt: state.lastSavedAt };
  });
  return result;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  phase: 'boot',
  activeSlot: null,
  setupSlot: null,
  slots: {},
  settings: { sound: true, haptics: true, language: 'en', languageChosen: false },
  bootstrap: async () => {
    try {
      const [states, settings] = await Promise.all([listLifeSlots(), loadGlobalSettings()]);
      useLifeStore.getState().updateSettings(settings);
      const normalized = { ...settings, language: isLanguage(settings.language) ? settings.language : 'en' as const };
      set({ slots: summaries(states), settings: normalized, phase: normalized.languageChosen ? 'menu' : 'language' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to bootstrap session store', error);
      const fallbackSettings = { sound: true, haptics: true, language: 'en', languageChosen: false } as const;
      useLifeStore.getState().updateSettings(fallbackSettings);
      set({ slots: {}, settings: fallbackSettings, phase: 'language' });
    }
  },
  refreshSlots: async () => set({ slots: summaries(await listLifeSlots()) }),
  openSetup: (setupSlot) => set({ phase: 'setup', setupSlot }),
  cancelSetup: () => set({ phase: 'menu', setupSlot: null }),
  beginGame: async (character) => {
    const slot = get().setupSlot;
    if (!slot) return;
    useLifeStore.getState().startNewLife(character);
    useLifeStore.getState().updateSettings(get().settings);
    await preloadLifePresentation(useLifeStore.getState());
    await saveLifeSlot(slot, selectLifePersistedState(useLifeStore.getState()));
    set({ phase: 'game', activeSlot: slot, setupSlot: null });
  },
  continueSlot: async (slot) => {
    const saved = await loadLifeSlot(slot);
    if (!saved) return;
    await preloadLifePresentation(saved);
    useLifeStore.getState().hydrate(saved);
    useLifeStore.getState().updateSettings(get().settings);
    set({ phase: 'game', activeSlot: slot, setupSlot: null });
  },
  continueLatest: async () => {
    const latest = Object.values(get().slots).sort((a, b) => b.savedAt - a.savedAt)[0];
    if (latest) await get().continueSlot(latest.slot);
  },
  deleteSlot: async (slot) => {
    await deleteLifeSlot(slot);
    await get().refreshSlots();
    if (get().activeSlot === slot) set({ activeSlot: null, phase: 'menu' });
  },
  returnToMenu: async () => {
    const slot = get().activeSlot;
    if (slot) {
      useLifeStore.getState().markSaved(Date.now());
      await saveLifeSlot(slot, selectLifePersistedState(useLifeStore.getState()));
    }
    await get().refreshSlots();
    set({ phase: 'menu', activeSlot: null });
  },
  openPanel: (phase) => set({ phase }),
  closePanel: () => set({ phase: 'menu' }),
  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    useLifeStore.getState().updateSettings(settings);
    await saveGlobalSettings(settings);
  },
  chooseLanguage: async (language) => {
    const settings = { ...get().settings, language, languageChosen: true };
    set({ settings, phase: get().phase === 'language' ? 'menu' : get().phase });
    useLifeStore.getState().updateSettings(settings);
    await saveGlobalSettings(settings);
  },
}));
