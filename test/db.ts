import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';

import type { AppDatabase } from '@/core/db';
import migrations from '@/core/db/migrations/migrations';

type Params = SQLInputValue[];

/**
 * Minimal stand-in for expo-sqlite's SQLiteDatabase over Node's built-in SQLite, exposing only
 * what drizzle's expo-sqlite session uses. Lets tests run the real driver + real migrations.
 */
function createExpoLikeClient(sqlite: DatabaseSync) {
  const wrap = (stmt: StatementSync, raw: boolean) => (params: Params) => {
    stmt.setReturnArrays(raw);
    let runResult: { changes: number; lastInsertRowId: number } | undefined;
    const run = () => {
      if (!runResult) {
        const r = stmt.run(...params);
        runResult = { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
      }
      return runResult;
    };
    return {
      get changes() {
        return run().changes;
      },
      get lastInsertRowId() {
        return run().lastInsertRowId;
      },
      getAllSync: () => stmt.all(...params),
      getFirstSync: () => stmt.get(...params) ?? null,
    };
  };

  return {
    prepareSync(sql: string) {
      const stmt = sqlite.prepare(sql);
      return { executeSync: wrap(stmt, false), executeForRawResultSync: wrap(stmt, true) };
    },
  };
}

export async function createTestDatabase(): Promise<AppDatabase> {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const db = drizzle(createExpoLikeClient(sqlite) as never);
  await migrate(db, migrations);
  return db;
}
