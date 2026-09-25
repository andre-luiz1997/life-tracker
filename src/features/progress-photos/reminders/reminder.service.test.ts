import type { AppDatabase } from '@/core/db';
import { uuidv7 } from '@/shared/lib/id';
import { createTestDatabase } from '@/test/db';

import { entries } from '../db/progress-photos.schema';
import * as repo from '../repositories/timelines.repository';
import { createTimelineService, type TimelineService } from '../services/timeline.service';
import { collectReminders } from './reminder.service';

describe('collectReminders', () => {
  let db: AppDatabase;
  let timelines: TimelineService;

  beforeEach(async () => {
    db = await createTestDatabase();
    timelines = createTimelineService({ db, files: { remove: jest.fn() }, translate: (k) => k });
  });

  it('only schedules timelines with a reminder, skipping archived ones', () => {
    const off = timelines.create({ templateKey: 'face', title: 'Sem lembrete', color: '#000' });
    const on = timelines.create({ templateKey: 'hair', title: 'Cabelo', color: '#000' });
    const archived = timelines.create({ templateKey: 'custom', title: 'Arquivada', color: '#000' });
    timelines.setReminder(on, { intervalDays: 14, time: '08:30' });
    timelines.setReminder(archived, { intervalDays: 7, time: '08:30' });
    timelines.setArchived(archived, true);

    const now = new Date(2026, 5, 1, 12);
    db.insert(entries)
      .values({ id: uuidv7(), timelineId: on, takenAt: new Date(2026, 4, 30, 10) })
      .run();

    const reminders = collectReminders(db, now);
    expect(reminders.map((r) => r.id)).toEqual([
      `timeline:${on}:0`,
      `timeline:${on}:1`,
      `timeline:${on}:2`,
    ]);
    expect(reminders[0]!.date).toEqual(new Date(2026, 5, 13, 8, 30));
    expect(reminders[0]!.data).toEqual({ timelineId: on });
    expect(repo.getTimeline(db, off)?.reminderIntervalDays).toBeNull();
  });

  it('turns reminders off', () => {
    const id = timelines.create({ templateKey: 'hair', title: 'Cabelo', color: '#000' });
    timelines.setReminder(id, { intervalDays: 14, time: '08:30' });
    timelines.setReminder(id, null);
    expect(collectReminders(db)).toEqual([]);
  });
});
