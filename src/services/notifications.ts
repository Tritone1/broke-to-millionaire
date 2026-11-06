import { Platform } from 'react-native';

import { OFFLINE_CAP_SECONDS } from '../game/config';

type NotificationsModule = typeof import('expo-notifications');

let scheduledNotificationId: string | null = null;
let notificationsPromise: Promise<NotificationsModule> | null = null;

async function notifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') return null;
  notificationsPromise ??= import('expo-notifications').then((module) => {
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    return module;
  });
  return notificationsPromise;
}

export async function requestNotificationPermission(): Promise<void> {
  try {
    const module = await notifications();
    if (!module) return;
    const existing = await module.getPermissionsAsync();
    if (existing.status !== 'granted') await module.requestPermissionsAsync();
  } catch {
    // Notifications can be unavailable in a simulator or Expo Go build.
  }
}

export async function scheduleCashReminder(): Promise<void> {
  try {
    const module = await notifications();
    if (!module) return;
    if (scheduledNotificationId) await module.cancelScheduledNotificationAsync(scheduledNotificationId);
    scheduledNotificationId = await module.scheduleNotificationAsync({
      content: {
        title: 'Your offline income is full, come collect it!',
        body: 'Your capped salary, business income, and investments are ready.',
        data: { destination: 'home' },
      },
      trigger: {
        type: module.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: OFFLINE_CAP_SECONDS,
        repeats: false,
      },
    });
  } catch {
    // The game loop and saving must continue if notification scheduling fails.
  }
}

export async function cancelCashReminder(): Promise<void> {
  if (!scheduledNotificationId) return;
  try {
    const module = await notifications();
    if (module) await module.cancelScheduledNotificationAsync(scheduledNotificationId);
  } catch {
    // The notification may already have fired.
  } finally {
    scheduledNotificationId = null;
  }
}
