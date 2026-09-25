import type { AppDatabase } from '@/core/db';
import { uuidv7 } from '@/shared/lib/id';
import { createTestDatabase } from '@/test/db';

import { entries, photos } from '../db/progress-photos.schema';
import * as photosRepo from '../repositories/photos.repository';
import * as timelinesRepo from '../repositories/timelines.repository';
import { createEntryService, type EntryService } from './entry.service';
import { createTimelineService } from './timeline.service';

describe('entry.service', () => {
  let db: AppDatabase;
  let service: EntryService;
  const files = { remove: jest.fn() };
  let timelineId: string;
  let entryId: string;
  let metricIds: string[];

  beforeEach(async () => {
    db = await createTestDatabase();
    files.remove.mockClear();
    service = createEntryService({ db, files });
    timelineId = createTimelineService({ db, files, translate: (k) => k }).create({
      templateKey: 'weight_loss',
      title: 'Corpo',
      color: '#000',
    });
    metricIds = timelinesRepo.listMetrics(db, timelineId).map((m) => m.id);
    entryId = uuidv7();
    db.insert(entries)
      .values({ id: entryId, timelineId, takenAt: new Date(2026, 0, 1) })
      .run();
  });

  it('updates the date and trims the note (empty → null)', () => {
    service.update(entryId, { takenAt: new Date(2026, 0, 3), note: '  jejum  ' });
    expect(photosRepo.getEntry(db, entryId)).toMatchObject({
      takenAt: new Date(2026, 0, 3),
      note: 'jejum',
    });
    service.update(entryId, { note: '   ' });
    expect(photosRepo.getEntry(db, entryId)?.note).toBeNull();
    // Omitted fields stay untouched.
    expect(photosRepo.getEntry(db, entryId)?.takenAt).toEqual(new Date(2026, 0, 3));
  });

  it('upserts and clears metric values', () => {
    const [weight, waist] = metricIds as [string, string];
    service.setMetricValues(entryId, { [weight]: 82.4, [waist]: 90 });
    service.setMetricValues(entryId, { [weight]: 81.9, [waist]: null });

    const values = photosRepo.listMetricValuesOfEntry(db, entryId);
    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({ metricId: weight, value: 81.9 });
  });

  it('lists metric values of the timeline chronologically', () => {
    const [weight] = metricIds as [string];
    const later = uuidv7();
    db.insert(entries)
      .values({ id: later, timelineId, takenAt: new Date(2026, 1, 1) })
      .run();
    service.setMetricValues(later, { [weight]: 80 });
    service.setMetricValues(entryId, { [weight]: 83 });
    expect(photosRepo.listMetricValuesOfTimeline(db, timelineId).map((r) => r.value.value)).toEqual(
      [83, 80],
    );
  });

  it('deletes the entry with its photos and files', () => {
    const angleId = timelinesRepo.listAngles(db, timelineId)[0]!.id;
    db.insert(photos)
      .values({
        id: uuidv7(),
        entryId,
        angleId,
        fileName: 'f',
        thumbFileName: 'f_t',
        width: 1,
        height: 1,
        source: 'camera',
      })
      .run();

    service.remove(entryId);
    expect(photosRepo.getEntry(db, entryId)).toBeUndefined();
    expect(db.select().from(photos).all()).toHaveLength(0);
    expect(files.remove).toHaveBeenCalledWith('photos', 'f');
    expect(files.remove).toHaveBeenCalledWith('thumbs', 'f_t');
  });
});
