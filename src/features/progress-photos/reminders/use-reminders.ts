import { addDatabaseChangeListener } from 'expo-sqlite';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { getDatabase } from '@/core/db';
import { i18n } from '@/core/i18n';
import {
  configureNotifications,
  replaceScheduledReminders,
  subscribeToReminderTaps,
} from '@/core/notifications';

import { collectReminders } from './reminder.service';

const WATCHED_TABLES = new Set(['timelines', 'entries']);
const DEBOUNCE_MS = 1000;

export async function syncReminders() {
  const t = i18n.getFixedT(null, 'photos');
  await replaceScheduledReminders(collectReminders(getDatabase()), {
    // Generic text: nothing about the timeline shows up on the lock screen.
    title: t('reminders.notificationTitle'),
    body: t('reminders.notificationBody'),
    channelName: t('reminders.channelName'),
  });
}

/**
 * Keeps scheduled reminders in sync: once at startup and whenever timelines or entries change
 * (new entry, date edit, reminder settings, archive/delete). Also routes reminder taps.
 */
export function useReminders() {
  useEffect(() => {
    configureNotifications();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncReminders().catch((e) => __DEV__ && console.warn('Reminder sync failed', e));
      }, DEBOUNCE_MS);
    };
    schedule();
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (WATCHED_TABLES.has(tableName)) schedule();
    });
    const unsubscribeTaps = subscribeToReminderTaps((data) => {
      if (typeof data.timelineId === 'string') {
        router.push({
          pathname: '/timeline/[timelineId]',
          params: { timelineId: data.timelineId },
        });
      }
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
      unsubscribeTaps();
    };
  }, []);
}
