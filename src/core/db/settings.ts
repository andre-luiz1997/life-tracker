import { eq } from 'drizzle-orm';

import { appSettings } from './app-settings.schema';
import type { DbExecutor } from './client';

/** Typed JSON preferences in `app_settings`. Never for secrets (those go to SecureStore). */
export function readSetting<T>(db: DbExecutor, key: string, fallback: T): T {
  const row = db.select().from(appSettings).where(eq(appSettings.key, key)).get();
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function writeSetting<T>(db: DbExecutor, key: string, value: T): void {
  const json = JSON.stringify(value);
  db.insert(appSettings)
    .values({ key, value: json })
    .onConflictDoUpdate({ target: appSettings.key, set: { value: json, updatedAt: new Date() } })
    .run();
}

export function deleteSetting(db: DbExecutor, key: string): void {
  db.delete(appSettings).where(eq(appSettings.key, key)).run();
}
