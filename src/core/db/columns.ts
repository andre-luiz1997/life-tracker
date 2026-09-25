import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

/** Timestamps shared by every table (base for future sync). Unix epoch in ms. */
export const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`)
    .$onUpdate(() => new Date()),
};

export const idColumn = () => text('id').primaryKey();
