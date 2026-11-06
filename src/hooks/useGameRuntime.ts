import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { startTimestampLoop } from '../game/tick';
import { cancelCashReminder, requestNotificationPermission, scheduleCashReminder } from '../services/notifications';
import { loadGame, saveGame } from '../services/storage';
import { selectPersistedState, useGameStore } from '../store/gameStore';

async function persistNow(): Promise<void> {
  const timestamp = Date.now();
  useGameStore.getState().markSaved(timestamp);
  await saveGame(selectPersistedState(useGameStore.getState()));
}

export function useGameRuntime(): void {
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void loadGame().then((saved) => {
      if (mounted) useGameStore.getState().hydrate(saved);
    });
    void requestNotificationPermission();

    const loop = startTimestampLoop((elapsed, now) => useGameStore.getState().tick(elapsed, now));
    const autosave = setInterval(() => void persistNow(), 10_000);

    const handleAppState = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
        void persistNow();
        void scheduleCashReminder();
      } else if (next === 'active') {
        if (backgroundedAt.current !== null) {
          useGameStore.getState().prepareOffline(Date.now() - backgroundedAt.current);
          backgroundedAt.current = null;
        }
        void cancelCashReminder();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      mounted = false;
      loop.stop();
      clearInterval(autosave);
      subscription.remove();
      void persistNow();
    };
  }, [backgroundedAt]);
}
