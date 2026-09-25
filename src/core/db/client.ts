import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { getDatabaseKey } from '@/core/crypto';
import { bytesToHex } from '@/shared/lib/bytes';

import migrations from './migrations/migrations';

export const DATABASE_NAME = 'life-tracker.db';

export type AppDatabase = ExpoSQLiteDatabase;

/** The database or a transaction: repositories accept either, so they compose inside `transaction`. */
export type DbExecutor = BaseSQLiteDatabase<'sync', unknown>;

let connection: { sqlite: SQLiteDatabase; db: AppDatabase } | null = null;

/**
 * Opens the SQLCipher-encrypted database. `PRAGMA key` must be the first statement,
 * before migrations or any read.
 */
export async function openDatabase(): Promise<AppDatabase> {
  if (connection) return connection.db;

  const key = await getDatabaseKey();
  // enableChangeListener is required by drizzle's useLiveQuery.
  const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
  sqlite.execSync(`PRAGMA key = "x'${bytesToHex(key)}'"`);
  sqlite.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

  connection = { sqlite, db: drizzle(sqlite) };
  return connection.db;
}

/** Opens the database and applies pending migrations (idempotent). */
export async function openMigratedDatabase(): Promise<AppDatabase> {
  const db = await openDatabase();
  await migrate(db, migrations);
  return db;
}

export function getDatabase(): AppDatabase {
  if (!connection) throw new Error('Database not opened. Wrap the app in <DatabaseProvider>.');
  return connection.db;
}

export function closeDatabase(): void {
  connection?.sqlite.closeSync();
  connection = null;
}
