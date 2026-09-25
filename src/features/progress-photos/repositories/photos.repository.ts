import { and, desc, eq } from 'drizzle-orm';

import type { DbExecutor } from '@/core/db';

import { entries, photos } from '../db/progress-photos.schema';

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
