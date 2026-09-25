import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Import the column helpers directly: drizzle-kit loads schemas outside React Native.
import { idColumn, timestamps } from '@/core/db/columns';

export const TEMPLATE_KEYS = ['weight_loss', 'hair', 'face', 'custom'] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const timelines = sqliteTable('timelines', {
  id: idColumn(),
  title: text('title').notNull(),
  templateKey: text('template_key', { enum: TEMPLATE_KEYS }).notNull(),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  reminderIntervalDays: integer('reminder_interval_days'),
  /** Local time "HH:mm". */
  reminderTime: text('reminder_time'),
  archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
  ...timestamps,
});

export const timelineAngles = sqliteTable(
  'timeline_angles',
  {
    id: idColumn(),
    timelineId: text('timeline_id')
      .notNull()
      .references(() => timelines.id, { onDelete: 'cascade' }),
    /** Template angle key (drives overlay/camera defaults) or a generated key for custom angles. */
    key: text('key').notNull(),
    label: text('label').notNull(),
    overlayKey: text('overlay_key'),
    sortOrder: integer('sort_order').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index('timeline_angles_timeline_idx').on(t.timelineId, t.sortOrder),
    uniqueIndex('timeline_angles_key_uq').on(t.timelineId, t.key),
  ],
);

export const entries = sqliteTable(
  'entries',
  {
    id: idColumn(),
    timelineId: text('timeline_id')
      .notNull()
      .references(() => timelines.id, { onDelete: 'cascade' }),
    takenAt: integer('taken_at', { mode: 'timestamp_ms' }).notNull(),
    note: text('note'),
    ...timestamps,
  },
  (t) => [index('entries_timeline_taken_idx').on(t.timelineId, t.takenAt)],
);

export const PHOTO_SOURCES = ['camera', 'gallery'] as const;

export const photos = sqliteTable(
  'photos',
  {
    id: idColumn(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    angleId: text('angle_id')
      .notNull()
      .references(() => timelineAngles.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    thumbFileName: text('thumb_file_name').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    source: text('source', { enum: PHOTO_SOURCES }).notNull(),
    ...timestamps,
  },
  (t) => [index('photos_entry_idx').on(t.entryId), index('photos_angle_idx').on(t.angleId)],
);

export const metricDefinitions = sqliteTable(
  'metric_definitions',
  {
    id: idColumn(),
    timelineId: text('timeline_id')
      .notNull()
      .references(() => timelines.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    label: text('label').notNull(),
    unit: text('unit').notNull(),
    sortOrder: integer('sort_order').notNull(),
    ...timestamps,
  },
  (t) => [
    index('metric_definitions_timeline_idx').on(t.timelineId, t.sortOrder),
    uniqueIndex('metric_definitions_key_uq').on(t.timelineId, t.key),
  ],
);

export const metricValues = sqliteTable(
  'metric_values',
  {
    id: idColumn(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    metricId: text('metric_id')
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: 'cascade' }),
    value: real('value').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('metric_values_entry_metric_uq').on(t.entryId, t.metricId)],
);

export type Timeline = typeof timelines.$inferSelect;
export type NewTimeline = typeof timelines.$inferInsert;
export type TimelineAngle = typeof timelineAngles.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type MetricDefinition = typeof metricDefinitions.$inferSelect;
export type MetricValue = typeof metricValues.$inferSelect;
