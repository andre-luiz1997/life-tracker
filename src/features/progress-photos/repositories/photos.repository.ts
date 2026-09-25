import { and, asc, desc, eq } from 'drizzle-orm';

import type { DbExecutor } from '@/core/db';

import { entries, metricValues, photos } from '../db/progress-photos.schema';

export type NewEntry = typeof entries.$inferInsert;
export type NewPhoto = typeof photos.$inferInsert;

export function getEntry(db: DbExecutor, id: string) {
  return db.select().from(entries).where(eq(entries.id, id)).get();
}

export function insertEntry(db: DbExecutor, values: NewEntry) {
  db.insert(entries).values(values).run();
}

export function deleteEntry(db: DbExecutor, id: string) {
  db.delete(entries).where(eq(entries.id, id)).run();
}

export function insertPhoto(db: DbExecutor, values: NewPhoto) {
  db.insert(photos).values(values).run();
}

export function getPhoto(db: DbExecutor, id: string) {
  return db.select().from(photos).where(eq(photos.id, id)).get();
}

export function deletePhoto(db: DbExecutor, id: string) {
  db.delete(photos).where(eq(photos.id, id)).run();
}

export function findPhotoInEntry(db: DbExecutor, entryId: string, angleId: string) {
  return db
    .select()
    .from(photos)
    .where(and(eq(photos.entryId, entryId), eq(photos.angleId, angleId)))
    .get();
}

export function listEntryPhotos(db: DbExecutor, entryId: string) {
  return db.select().from(photos).where(eq(photos.entryId, entryId)).all();
}

/** Most recent photo of an angle (by entry date), used as the "ghost" overlay. */
export function getLatestPhotoOfAngle(db: DbExecutor, angleId: string, excludeEntryId?: string) {
  const rows = db
    .select({ photo: photos, takenAt: entries.takenAt })
    .from(photos)
    .innerJoin(entries, eq(entries.id, photos.entryId))
    .where(eq(photos.angleId, angleId))
    .orderBy(desc(entries.takenAt), desc(photos.createdAt))
    .limit(2)
    .all();
  return rows.find((r) => r.photo.entryId !== excludeEntryId)?.photo;
}

/** Every file name referenced by the database, for the orphan cleanup routine. */
export function listAllPhotoFileNames(db: DbExecutor) {
  return db
    .select({ fileName: photos.fileName, thumbFileName: photos.thumbFileName })
    .from(photos)
    .all();
}

// Timeline listing

export function listEntries(db: DbExecutor, timelineId: string) {
  return db
    .select()
    .from(entries)
    .where(eq(entries.timelineId, timelineId))
    .orderBy(desc(entries.takenAt))
    .all();
}

export function listPhotosOfTimeline(db: DbExecutor, timelineId: string) {
  return db
    .select({ photo: photos })
    .from(photos)
    .innerJoin(entries, eq(entries.id, photos.entryId))
    .where(eq(entries.timelineId, timelineId))
    .all()
    .map((r) => r.photo);
}

/** Photos of one angle in chronological order (viewer / comparison). */
export function listPhotosOfAngle(db: DbExecutor, angleId: string) {
  return db
    .select({ photo: photos, takenAt: entries.takenAt })
    .from(photos)
    .innerJoin(entries, eq(entries.id, photos.entryId))
    .where(eq(photos.angleId, angleId))
    .orderBy(asc(entries.takenAt))
    .all();
}

export function updateEntry(
  db: DbExecutor,
  id: string,
  values: Partial<Pick<NewEntry, 'takenAt' | 'note'>>,
) {
  db.update(entries).set(values).where(eq(entries.id, id)).run();
}

// Metric values

export function listMetricValuesOfTimeline(db: DbExecutor, timelineId: string) {
  return db
    .select({ value: metricValues, takenAt: entries.takenAt })
    .from(metricValues)
    .innerJoin(entries, eq(entries.id, metricValues.entryId))
    .where(eq(entries.timelineId, timelineId))
    .orderBy(asc(entries.takenAt))
    .all();
}

export function listMetricValuesOfEntry(db: DbExecutor, entryId: string) {
  return db.select().from(metricValues).where(eq(metricValues.entryId, entryId)).all();
}

export function upsertMetricValue(
  db: DbExecutor,
  values: { id: string; entryId: string; metricId: string; value: number },
) {
  db.insert(metricValues)
    .values(values)
    .onConflictDoUpdate({
      target: [metricValues.entryId, metricValues.metricId],
      set: { value: values.value, updatedAt: new Date() },
    })
    .run();
}

export function deleteMetricValue(db: DbExecutor, entryId: string, metricId: string) {
  db.delete(metricValues)
    .where(and(eq(metricValues.entryId, entryId), eq(metricValues.metricId, metricId)))
    .run();
}

/** Thumbnail of the most recent photo of a timeline (home card cover). */
export function getCoverThumb(db: DbExecutor, timelineId: string): string | null {
  return (
    db
      .select({ thumb: photos.thumbFileName })
      .from(photos)
      .innerJoin(entries, eq(entries.id, photos.entryId))
      .where(eq(entries.timelineId, timelineId))
      .orderBy(desc(entries.takenAt), desc(photos.createdAt))
      .limit(1)
      .get()?.thumb ?? null
  );
}
