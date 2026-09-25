import { eq } from 'drizzle-orm';

import type { AppDatabase } from '@/core/db';
import { uuidv7 } from '@/shared/lib/id';
import { createTestDatabase } from '@/test/db';

import { entries, photos, timelineAngles } from '../db/progress-photos.schema';
import * as repo from '../repositories/timelines.repository';
import { createTimelineService, TimelineError, type TimelineService } from './timeline.service';

describe('timeline.service', () => {
  let db: AppDatabase;
  let service: TimelineService;
  const files = { remove: jest.fn() };

  beforeEach(async () => {
    db = await createTestDatabase();
    files.remove.mockClear();
    service = createTimelineService({ db, files, translate: (key) => `t(${key})` });
  });

  function addPhoto(timelineId: string, angleId: string, name: string, takenAt = new Date()) {
    const entryId = uuidv7();
    db.insert(entries).values({ id: entryId, timelineId, takenAt }).run();
    db.insert(photos)
      .values({
        id: uuidv7(),
        entryId,
        angleId,
        fileName: name,
        thumbFileName: `${name}-thumb`,
        width: 100,
        height: 100,
        source: 'camera',
      })
      .run();
  }

  describe('create', () => {
    it('creates the timeline with the template angles and default metrics', () => {
      const id = service.create({ templateKey: 'weight_loss', title: '  Corpo  ', color: '#000' });

      const timeline = repo.getTimeline(db, id);
      expect(timeline).toMatchObject({ title: 'Corpo', templateKey: 'weight_loss', icon: 'body' });
      expect(timeline?.reminderIntervalDays).toBeNull(); // suggestion only (opt-in)

      const angles = repo.listAngles(db, id);
      expect(angles.map((a) => a.key)).toEqual([
        'body_front',
        'body_back',
        'body_left',
        'body_right',
        'torso',
        'arms_relaxed',
        'arms_flexed',
        'legs',
        'glutes',
      ]);
      expect(angles[0]).toMatchObject({ label: 't(photos:angles.body_front)', isActive: true });
      expect(angles.filter((a) => a.isActive)).toHaveLength(4);

      // body_fat is optional, so it's only a suggestion.
      expect(repo.listMetrics(db, id).map((m) => [m.key, m.unit])).toEqual([
        ['weight', 'kg'],
        ['waist', 'cm'],
        ['hip', 'cm'],
      ]);
    });

    it('creates hair timelines without mandatory metrics', () => {
      const id = service.create({ templateKey: 'hair', title: 'Cabelo', color: '#000' });
      expect(repo.listAngles(db, id)).toHaveLength(6);
      expect(repo.listMetrics(db, id)).toHaveLength(0);
    });
  });

  describe('summaries', () => {
    it('counts entries and separates archived timelines', () => {
      const a = service.create({ templateKey: 'face', title: 'A', color: '#000' });
      const b = service.create({ templateKey: 'custom', title: 'B', color: '#000' });
      const angle = repo.listAngles(db, a)[0]!;
      addPhoto(a, angle.id, 'p1', new Date(2026, 0, 1));
      addPhoto(a, angle.id, 'p2', new Date(2026, 0, 5));
      service.setArchived(b, true);

      const active = repo.listTimelineSummaries(db, { archived: false });
      expect(active).toHaveLength(1);
      expect(active[0]).toMatchObject({ id: a, entryCount: 2 });
      expect(active[0]!.lastEntryAt).toEqual(new Date(2026, 0, 5));

      const archived = repo.listTimelineSummaries(db, { archived: true });
      expect(archived.map((t) => t.id)).toEqual([b]);
      expect(archived[0]).toMatchObject({ entryCount: 0, lastEntryAt: null });
      expect(archived[0]!.archivedAt).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('only changes the given fields', () => {
      const id = service.create({ templateKey: 'custom', title: 'Antes', color: '#111' });
      service.update(id, { color: '#222' });
      expect(repo.getTimeline(db, id)).toMatchObject({ title: 'Antes', color: '#222' });
    });
  });

  describe('remove', () => {
    it('deletes rows in cascade and the encrypted files', () => {
      const id = service.create({ templateKey: 'custom', title: 'X', color: '#000' });
      addPhoto(id, repo.listAngles(db, id)[0]!.id, 'photo-1');

      service.remove(id);

      expect(repo.getTimeline(db, id)).toBeUndefined();
      expect(db.select().from(entries).all()).toHaveLength(0);
      expect(db.select().from(timelineAngles).all()).toHaveLength(0);
      expect(files.remove).toHaveBeenCalledWith('photos', 'photo-1');
      expect(files.remove).toHaveBeenCalledWith('thumbs', 'photo-1-thumb');
    });
  });

  describe('angles', () => {
    it('adds custom angles at the end', () => {
      const id = service.create({ templateKey: 'custom', title: 'X', color: '#000' });
      const angleId = service.addAngle(id, ' Lado ');
      const angles = repo.listAngles(db, id);
      expect(angles.at(-1)).toMatchObject({ id: angleId, label: 'Lado', sortOrder: 1 });
      expect(angles.at(-1)!.key).toBe(`custom_${angleId}`);
    });

    it('reorders angles', () => {
      const id = service.create({ templateKey: 'hair', title: 'X', color: '#000' });
      const [first, second] = repo.listAngles(db, id);
      service.moveAngle(second!.id, 'up');
      expect(
        repo
          .listAngles(db, id)
          .slice(0, 2)
          .map((a) => a.id),
      ).toEqual([second!.id, first!.id]);
      // No-op at the top.
      service.moveAngle(second!.id, 'up');
      expect(repo.listAngles(db, id)[0]!.id).toBe(second!.id);
    });

    it('keeps at least one active angle', () => {
      const id = service.create({ templateKey: 'custom', title: 'X', color: '#000' });
      const only = repo.listAngles(db, id)[0]!;
      expect(() => service.setAngleActive(only.id, false)).toThrow(TimelineError);
      expect(() => service.removeAngle(only.id)).toThrow(TimelineError);

      const other = service.addAngle(id, 'Outro');
      service.setAngleActive(only.id, false);
      expect(repo.getAngle(db, only.id)?.isActive).toBe(false);
      expect(() => service.removeAngle(other)).toThrow(TimelineError);
    });

    it('removes an angle with its photos', () => {
      const id = service.create({ templateKey: 'face', title: 'X', color: '#000' });
      const angle = repo.listAngles(db, id)[0]!;
      addPhoto(id, angle.id, 'face-1');

      service.removeAngle(angle.id);

      expect(repo.getAngle(db, angle.id)).toBeUndefined();
      expect(db.select().from(photos).where(eq(photos.angleId, angle.id)).all()).toHaveLength(0);
      expect(files.remove).toHaveBeenCalledWith('photos', 'face-1');
    });
  });

  describe('metrics', () => {
    it('adds, updates, reorders and removes metrics', () => {
      const id = service.create({ templateKey: 'weight_loss', title: 'X', color: '#000' });
      const arm = service.addMetric(id, { label: 'Braço', unit: 'cm' });
      const fat = service.addMetric(id, { label: 'Gordura', unit: '%', key: 'body_fat' });
      expect(repo.listMetrics(db, id).map((m) => m.key)).toEqual([
        'weight',
        'waist',
        'hip',
        `custom_${arm}`,
        'body_fat',
      ]);

      service.updateMetric(arm, { unit: 'mm' });
      expect(repo.getMetric(db, arm)).toMatchObject({ label: 'Braço', unit: 'mm' });

      service.moveMetric(fat, 'up');
      expect(repo.listMetrics(db, id).at(-1)!.id).toBe(arm);

      service.removeMetric(arm);
      expect(repo.getMetric(db, arm)).toBeUndefined();
    });
  });
});
