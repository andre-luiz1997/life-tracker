import { formatTime, parseTime, reminderDates } from './schedule';

const d = (m: number, day: number, h = 0, min = 0) => new Date(2026, m, day, h, min);

describe('reminder schedule', () => {
  it('parses HH:mm with a safe default', () => {
    expect(parseTime('07:30')).toEqual({ hours: 7, minutes: 30 });
    expect(parseTime(null)).toEqual({ hours: 9, minutes: 0 });
    expect(parseTime('25:00')).toEqual({ hours: 9, minutes: 0 });
    expect(formatTime(d(0, 1, 7, 5))).toBe('07:05');
  });

  it('schedules interval days after the last entry, at the chosen time, repeating', () => {
    const dates = reminderDates({
      lastEntryAt: d(0, 10, 20, 15),
      createdAt: d(0, 1),
      intervalDays: 7,
      time: '08:00',
      now: d(0, 12, 12),
    });
    expect(dates).toEqual([d(0, 17, 8), d(0, 24, 8), d(0, 31, 8)]);
  });

  it('uses the creation date when there are no entries', () => {
    const [first] = reminderDates({
      lastEntryAt: null,
      createdAt: d(2, 1),
      intervalDays: 14,
      time: '09:00',
      now: d(2, 2),
    });
    expect(first).toEqual(d(2, 15, 9));
  });

  it('moves overdue reminders to the next time slot', () => {
    const base = { lastEntryAt: d(0, 1), createdAt: d(0, 1), intervalDays: 7, time: '18:00' };
    // Overdue, but today's 18:00 hasn't passed yet.
    expect(reminderDates({ ...base, now: d(0, 20, 10) })[0]).toEqual(d(0, 20, 18));
    // Overdue and today's slot already passed → tomorrow.
    expect(reminderDates({ ...base, now: d(0, 20, 19) })[0]).toEqual(d(0, 21, 18));
  });

  it('returns nothing for invalid intervals', () => {
    expect(
      reminderDates({
        lastEntryAt: null,
        createdAt: d(0, 1),
        intervalDays: 0,
        time: null,
        now: d(0, 1),
      }),
    ).toEqual([]);
  });
});
