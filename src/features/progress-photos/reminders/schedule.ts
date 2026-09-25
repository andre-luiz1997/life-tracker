export const DEFAULT_REMINDER_TIME = '09:00';
/** Reminders scheduled ahead per timeline, so they keep coming even if the app isn't opened. */
export const REMINDERS_AHEAD = 3;

export function parseTime(time: string | null | undefined): { hours: number; minutes: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  const hours = m ? Number(m[1]) : 9;
  const minutes = m ? Number(m[2]) : 0;
  return hours < 24 && minutes < 60 ? { hours, minutes } : { hours: 9, minutes: 0 };
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function atTime(day: Date, time: { hours: number; minutes: number }) {
  const d = new Date(day);
  d.setHours(time.hours, time.minutes, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Next reminder dates for a timeline: `interval` days after the last entry (or creation), at the
 * chosen time. If that moment already passed (overdue), the next one is the next time slot
 * (today or tomorrow). Later reminders repeat every `interval` days.
 */
export function reminderDates({
  lastEntryAt,
  createdAt,
  intervalDays,
  time,
  now,
  count = REMINDERS_AHEAD,
}: {
  lastEntryAt: Date | null;
  createdAt: Date;
  intervalDays: number;
  time: string | null;
  now: Date;
  count?: number;
}): Date[] {
  if (intervalDays < 1) return [];
  const t = parseTime(time);
  let first = atTime(addDays(lastEntryAt ?? createdAt, intervalDays), t);
  if (first <= now) {
    const today = atTime(now, t);
    first = today > now ? today : addDays(today, 1);
  }
  return Array.from({ length: count }, (_, i) => addDays(first, i * intervalDays));
}
