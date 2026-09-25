import type { DbExecutor } from '@/core/db';
import type { ScheduledReminder } from '@/core/notifications';

import { listTimelineSummaries } from '../repositories/timelines.repository';
import { reminderDates } from './schedule';

/**
 * Reminders for every active (not archived) timeline with a reminder interval.
 * Notification data carries only the timeline id — never its title (lock-screen privacy).
 */
export function collectReminders(db: DbExecutor, now = new Date()): ScheduledReminder[] {
  return listTimelineSummaries(db, { archived: false }).flatMap((timeline) =>
    timeline.reminderIntervalDays
      ? reminderDates({
          lastEntryAt: timeline.lastEntryAt,
          createdAt: timeline.createdAt,
          intervalDays: timeline.reminderIntervalDays,
          time: timeline.reminderTime,
          now,
        }).map((date, i) => ({
          id: `timeline:${timeline.id}:${i}`,
          date,
          data: { timelineId: timeline.id },
        }))
      : [],
  );
}
