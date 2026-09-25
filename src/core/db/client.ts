import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { getDatabaseKey } from '@/core/crypto';
import { bytesToHex } from '@/shared/lib/bytes';

export const DATABASE_NAME = 'life-tracker.db';

export type AppDatabase = ExpoSQLiteDatabase;

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

export function getDatabase(): AppDatabase {
  if (!connection) throw new Error('Database not opened. Wrap the app in <DatabaseProvider>.');
  return connection.db;
}

export function closeDatabase(): void {
  connection?.sqlite.closeSync();
  connection = null;
}
