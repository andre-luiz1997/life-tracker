import { sql } from 'drizzle-orm';

import { createTestDatabase } from '@/test/db';

import { dumpDatabase, importDump, IncompatibleDumpError } from './dump';
import { readSetting, writeSetting } from './settings';

describe('database dump', () => {
  it('round-trips every table into a fresh database', async () => {
    const source = await createTestDatabase();
    writeSetting(source, 'theme', { dark: true });
    source.run(
      sql`insert into timelines (id, title, template_key, color, icon) values ('t1', 'Corpo', 'weight_loss', '#000', 'body')`,
    );
    source.run(
      sql`insert into entries (id, timeline_id, taken_at) values ('e1', 't1', 1700000000000)`,
    );

    const dump = dumpDatabase(source);
    expect(dump.schemaVersion).toBeGreaterThanOrEqual(2);
    expect(Object.keys(dump.tables)).toEqual(
      expect.arrayContaining(['app_settings', 'timelines', 'entries', 'photos']),
    );
    expect(dump.tables.__drizzle_migrations).toBeUndefined();

    const target = await createTestDatabase();
    // JSON round trip, as in the real backup file.
    importDump(target, JSON.parse(JSON.stringify(dump)));
    expect(readSetting(target, 'theme', null)).toEqual({ dark: true });
    expect(target.all(sql`select id, title from timelines`)).toEqual([
      { id: 't1', title: 'Corpo' },
    ]);
    expect(target.get(sql`select taken_at from entries`)).toEqual({ taken_at: 1700000000000 });
  });

  it('ignores unknown tables/columns and imports children before parents', async () => {
    const target = await createTestDatabase();
    const dump = {
      schemaVersion: 1,
      tables: {
        // Child listed first: foreign keys are only checked at the end.
        entries: [{ id: 'e1', timeline_id: 't1', taken_at: 1, legacy_column: 'x' }],
        timelines: [
          { id: 't1', title: 'A', template_key: 'custom', color: '#000', icon: 'sparkles' },
        ],
        removed_table: [{ id: 1 }],
      },
    };
    importDump(target, dump);
    expect(target.all(sql`select id from entries`)).toEqual([{ id: 'e1' }]);
  });

  it('rejects backups from a newer app and broken references', async () => {
    const target = await createTestDatabase();
    expect(() => importDump(target, { schemaVersion: 999, tables: {} })).toThrow(
      IncompatibleDumpError,
    );
    expect(() =>
      importDump(target, {
        schemaVersion: 1,
        tables: { entries: [{ id: 'e', timeline_id: 'missing', taken_at: 1 }] },
      }),
    ).toThrow(IncompatibleDumpError);
    // Rolled back, and foreign keys are back on.
    expect(target.all(sql`select * from entries`)).toEqual([]);
    expect(target.get(sql`PRAGMA foreign_keys`)).toEqual({ foreign_keys: 1 });
  });
});
