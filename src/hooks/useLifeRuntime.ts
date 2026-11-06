import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { startTimestampLoop } from '../game/tick';
import { cancelCashReminder, requestNotificationPermission, scheduleCashReminder } from '../services/notifications';
import { loadLifeSlot, saveLifeSlot, type SlotId } from '../services/lifeStorage';
import { selectLifePersistedState, useLifeStore } from '../store/lifeStore';
import { useSessionStore } from '../store/sessionStore';

async function persistLifeNow(slot: SlotId): Promise<void> {
  const timestamp = Date.now();
  useLifeStore.getState().markSaved(timestamp);
  await saveLifeSlot(slot, selectLifePersistedState(useLifeStore.getState()));
}

export function useLifeRuntime(): void {
  const backgroundedAt = useRef<number | null>(null);
  const activeSlot = useSessionStore((state) => state.activeSlot);

  useEffect(() => {
    if (!activeSlot) return;
    void requestNotificationPermission();
    const loop = startTimestampLoop((elapsed, now) => useLifeStore.getState().tick(elapsed, now));
    const autosave = setInterval(() => {
      if (backgroundedAt.current === null) void persistLifeNow(activeSlot);
    }, 10_000);
    const handleState = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        if (backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
          void persistLifeNow(activeSlot);
          void scheduleCashReminder();
        }
      } else if (next === 'active') {
        void cancelCashReminder();
        if (backgroundedAt.current !== null) {
          void loadLifeSlot(activeSlot).then((saved) => {
            if (saved) useLifeStore.getState().hydrate(saved);
            backgroundedAt.current = null;
          });
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleState);
    return () => {
      loop.stop();
      clearInterval(autosave);
      subscription.remove();
      void persistLifeNow(activeSlot);
    };
  }, [activeSlot]);
}
