import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { withExternalActivity } from '@/core/lifecycle';

const CHANNEL_ID = 'reminders';

export type ScheduledReminder = { id: string; date: Date; data: Record<string, string> };
export type ReminderContent = { title: string; body: string; channelName: string };

/** Show reminders even when the app is open. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return withExternalActivity(async () => (await Notifications.requestPermissionsAsync()).granted);
}

/**
 * Replaces every scheduled local notification of the app with `reminders`. The app only ever
 * schedules reminders, so cancelling all is safe and keeps the schedule idempotent.
 * Does nothing (and schedules nothing) without permission.
 */
export async function replaceScheduledReminders(
  reminders: ScheduledReminder[],
  content: ReminderContent,
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminders.length || !(await hasNotificationPermission())) return 0;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: content.channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Promise.all(
    reminders.map((r) =>
      Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: content.title, body: content.body, data: r.data },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.date,
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
  return reminders.length;
}

/** Calls `onOpen` with the notification data when the user taps a reminder (incl. cold start). */
export function subscribeToReminderTaps(onOpen: (data: Record<string, unknown>) => void) {
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) {
        onOpen(response.notification.request.content.data ?? {});
        Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    })
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener((response) =>
    onOpen(response.notification.request.content.data ?? {}),
  );
  return () => sub.remove();
}

export function cancelAllReminders(): Promise<void> {
  return Notifications.cancelAllScheduledNotificationsAsync();
}
