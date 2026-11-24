import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { startTimestampLoop } from '../game/tick';
import { isAdAppStateTransition } from '../services/adLifecycle';
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
  const backgroundedForAd = useRef(false);
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
        if (isAdAppStateTransition()) {
          backgroundedForAd.current = true;
          return;
        }
        if (backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
          void persistLifeNow(activeSlot);
          void scheduleCashReminder();
        }
      } else if (next === 'active') {
        void cancelCashReminder();
        if (backgroundedForAd.current || isAdAppStateTransition()) {
          backgroundedForAd.current = false;
          backgroundedAt.current = null;
          // A full-screen ad is not offline play. Move the runtime clock forward,
          // but do not write the still-open reward summary back to storage before
          // the awaiting ad claim has had a chance to clear it.
          useLifeStore.getState().markSaved(Date.now());
          return;
        }
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
