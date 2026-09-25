import { sql } from 'drizzle-orm';

import type { DbExecutor } from './client';

type Row = Record<string, unknown>;

export type DatabaseDump = {
  /** Number of applied migrations: a backup can only be restored by the same or newer app. */
  schemaVersion: number;
  tables: Record<string, Row[]>;
};

const MIGRATIONS_TABLE = '__drizzle_migrations';

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

function userTables(db: DbExecutor): string[] {
  return db
    .all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name != ${MIGRATIONS_TABLE} order by name`,
    )
    .map((r) => r.name);
}

export function schemaVersion(db: DbExecutor): number {
  return (
    db.get<{ n: number }>(sql.raw(`select count(*) as n from ${quote(MIGRATIONS_TABLE)}`))?.n ?? 0
  );
}

/** Every row of every app table, schema-agnostic (features don't need to register anything). */
export function dumpDatabase(db: DbExecutor): DatabaseDump {
  const tables: Record<string, Row[]> = {};
  for (const name of userTables(db)) {
    tables[name] = db.all<Row>(sql.raw(`select * from ${quote(name)}`));
  }
  return { schemaVersion: schemaVersion(db), tables };
}

export class IncompatibleDumpError extends Error {
  override name = 'IncompatibleDumpError';
}

/**
 * Loads a dump into an empty, migrated database. Only columns that exist in the current schema
 * are inserted (columns added since then take their defaults). Foreign keys are checked at the end.
 */
export function importDump(db: DbExecutor, dump: DatabaseDump): void {
  if (dump.schemaVersion > schemaVersion(db))
    throw new IncompatibleDumpError('Backup is newer than the app');
  const existing = new Set(userTables(db));

  db.run(sql`PRAGMA foreign_keys = OFF`);
  try {
    db.transaction((tx) => {
      for (const [table, rows] of Object.entries(dump.tables)) {
        if (!existing.has(table) || !rows.length) continue;
        const columns = new Set(
          tx
            .all<{ name: string }>(sql.raw(`PRAGMA table_info(${quote(table)})`))
            .map((c) => c.name),
        );
        for (const row of rows) {
          const keys = Object.keys(row).filter((k) => columns.has(k));
          if (!keys.length) continue;
          const values = sql.join(
            keys.map((k) => sql`${row[k] as never}`),
            sql`, `,
          );
          tx.run(
            sql`insert into ${sql.raw(quote(table))} (${sql.raw(keys.map(quote).join(', '))}) values (${values})`,
          );
        }
      }
      const violations = tx.all(sql`PRAGMA foreign_key_check`);
      if (violations.length) throw new IncompatibleDumpError('Backup has broken references');
    });
  } finally {
    db.run(sql`PRAGMA foreign_keys = ON`);
  }
}
