import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './columns';

/** Non-secret key/value preferences. Secrets live in SecureStore. */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  ...timestamps,
});
