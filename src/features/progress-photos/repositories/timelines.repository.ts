import { asc, count, desc, eq, isNotNull, isNull, max, sql } from 'drizzle-orm';

import type { DbExecutor } from '@/core/db';

import {
  entries,
  metricDefinitions,
  type NewTimeline,
  photos,
  timelineAngles,
  timelines,
} from '../db/progress-photos.schema';

export type TimelineSummary = typeof timelines.$inferSelect & {
  entryCount: number;
  lastEntryAt: Date | null;
};

export type NewAngle = typeof timelineAngles.$inferInsert;
export type NewMetric = typeof metricDefinitions.$inferInsert;

export function listTimelineSummaries(
  db: DbExecutor,
  { archived }: { archived: boolean },
): TimelineSummary[] {
  const rows = db
    .select({
      timeline: timelines,
      entryCount: count(entries.id),
      lastEntryAt: max(entries.takenAt),
    })
    .from(timelines)
    .leftJoin(entries, eq(entries.timelineId, timelines.id))
    .where(archived ? isNotNull(timelines.archivedAt) : isNull(timelines.archivedAt))
    .groupBy(timelines.id)
    .orderBy(desc(sql`coalesce(${max(entries.takenAt)}, ${timelines.createdAt})`))
    .all();

  return rows.map(({ timeline, entryCount, lastEntryAt }) => ({
    ...timeline,
    entryCount,
    // max() over a timestamp column comes back as the raw integer.
    lastEntryAt: lastEntryAt == null ? null : new Date(Number(lastEntryAt)),
  }));
}

export function getTimeline(db: DbExecutor, id: string) {
  return db.select().from(timelines).where(eq(timelines.id, id)).get();
}

export function countEntries(db: DbExecutor, timelineId: string): number {
  return (
    db.select({ n: count() }).from(entries).where(eq(entries.timelineId, timelineId)).get()?.n ?? 0
  );
}

export function insertTimeline(db: DbExecutor, values: NewTimeline) {
  db.insert(timelines).values(values).run();
}

export function updateTimeline(
  db: DbExecutor,
  id: string,
  values: Partial<Omit<NewTimeline, 'id' | 'createdAt'>>,
) {
  db.update(timelines).set(values).where(eq(timelines.id, id)).run();
}

export function deleteTimeline(db: DbExecutor, id: string) {
  db.delete(timelines).where(eq(timelines.id, id)).run();
}

// Angles

export function listAngles(db: DbExecutor, timelineId: string) {
  return db
    .select()
    .from(timelineAngles)
    .where(eq(timelineAngles.timelineId, timelineId))
    .orderBy(asc(timelineAngles.sortOrder))
    .all();
}

export function getAngle(db: DbExecutor, id: string) {
  return db.select().from(timelineAngles).where(eq(timelineAngles.id, id)).get();
}

export function insertAngles(db: DbExecutor, values: NewAngle[]) {
  if (values.length) db.insert(timelineAngles).values(values).run();
}

export function updateAngle(
  db: DbExecutor,
  id: string,
  values: Partial<Pick<NewAngle, 'label' | 'isActive' | 'sortOrder'>>,
) {
  db.update(timelineAngles).set(values).where(eq(timelineAngles.id, id)).run();
}

export function deleteAngle(db: DbExecutor, id: string) {
  db.delete(timelineAngles).where(eq(timelineAngles.id, id)).run();
}

// Metrics

export function listMetrics(db: DbExecutor, timelineId: string) {
  return db
    .select()
    .from(metricDefinitions)
    .where(eq(metricDefinitions.timelineId, timelineId))
    .orderBy(asc(metricDefinitions.sortOrder))
    .all();
}

export function getMetric(db: DbExecutor, id: string) {
  return db.select().from(metricDefinitions).where(eq(metricDefinitions.id, id)).get();
}

export function insertMetrics(db: DbExecutor, values: NewMetric[]) {
  if (values.length) db.insert(metricDefinitions).values(values).run();
}

export function updateMetric(
  db: DbExecutor,
  id: string,
  values: Partial<Pick<NewMetric, 'label' | 'unit' | 'sortOrder'>>,
) {
  db.update(metricDefinitions).set(values).where(eq(metricDefinitions.id, id)).run();
}

export function deleteMetric(db: DbExecutor, id: string) {
  db.delete(metricDefinitions).where(eq(metricDefinitions.id, id)).run();
}

// Photo files (needed to clean up encrypted files when deleting)

export function listPhotoFilesOfTimeline(db: DbExecutor, timelineId: string) {
  return db
    .select({ fileName: photos.fileName, thumbFileName: photos.thumbFileName })
    .from(photos)
    .innerJoin(entries, eq(entries.id, photos.entryId))
    .where(eq(entries.timelineId, timelineId))
    .all();
}

export function listPhotoFilesOfAngle(db: DbExecutor, angleId: string) {
  return db
    .select({ fileName: photos.fileName, thumbFileName: photos.thumbFileName })
    .from(photos)
    .where(eq(photos.angleId, angleId))
    .all();
}
