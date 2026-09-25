import { sql } from 'drizzle-orm';

import { IncompatibleDumpError } from '@/core/db';
import type { VaultArea } from '@/core/storage';
import { createTestDatabase } from '@/test/db';

import { InvalidBackupError } from '../lib/container';
import { createBackupService, WrongPasswordError } from './backup.service';

function memoryVault(initial: Partial<Record<VaultArea, Record<string, Uint8Array>>> = {}) {
  const store = {
    photos: new Map(Object.entries(initial.photos ?? {})),
    thumbs: new Map(Object.entries(initial.thumbs ?? {})),
  };
  return {
    store,
    list: (area: VaultArea) => [...store[area].keys()],
    read: async (area: VaultArea, name: string) => store[area].get(name)!,
    write: async (area: VaultArea, name: string, bytes: Uint8Array) => {
      store[area].set(name, bytes);
    },
  };
}

function memoryFile() {
  const chunks: Uint8Array[] = [];
  return {
    sink: { writeBytes: (b: Uint8Array) => chunks.push(b.slice()) },
    bytes() {
      const out = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
    },
  };
}

function reader(bytes: Uint8Array) {
  return () => {
    let offset = 0;
    return {
      readBytes: (n: number) => {
        const out = bytes.slice(offset, offset + n);
        offset += out.length;
        return out;
      },
    };
  };
}

describe('backup.service', () => {
  const service = createBackupService({
    appVersion: '1.0.0',
    iterations: 1000,
    now: () => new Date('2026-09-25T12:00:00Z'),
  });

  async function makeBackup(password = 'correct horse') {
    const db = await createTestDatabase();
    db.run(
      sql`insert into timelines (id, title, template_key, color, icon) values ('t1', 'Corpo', 'weight_loss', '#000', 'body')`,
    );
    db.run(
      sql`insert into timeline_angles (id, timeline_id, key, label, sort_order) values ('a1', 't1', 'body_front', 'Frente', 0)`,
    );
    db.run(sql`insert into entries (id, timeline_id, taken_at) values ('e1', 't1', 1758800000000)`);
    db.run(
      sql`insert into photos (id, entry_id, angle_id, file_name, thumb_file_name, width, height, source) values ('p1', 'e1', 'a1', 'p1', 'p1_t', 10, 20, 'camera')`,
    );
    const vault = memoryVault({
      photos: { p1: new Uint8Array([1, 2, 3]) },
      thumbs: { p1_t: new Uint8Array([9]) },
    });
    const file = memoryFile();
    await service.create(db, vault, password, file.sink);
    return file.bytes();
  }

  it('creates a backup that can be inspected and restored into a fresh install', async () => {
    const bytes = await makeBackup();
    // Nothing readable in plain text besides the header.
    expect(Buffer.from(bytes).includes(Buffer.from('Corpo'))).toBe(false);

    expect(await service.inspect(reader(bytes), 'correct horse', 99)).toEqual({
      createdAt: new Date('2026-09-25T12:00:00Z'),
      photoCount: 1,
    });

    const db = await createTestDatabase();
    const vault = memoryVault();
    expect(await service.restore(reader(bytes), 'correct horse', db, vault)).toBe(2);
    expect(db.all(sql`select id, title from timelines`)).toEqual([{ id: 't1', title: 'Corpo' }]);
    expect(db.get(sql`select file_name from photos`)).toEqual({ file_name: 'p1' });
    expect(vault.store.photos.get('p1')).toEqual(new Uint8Array([1, 2, 3]));
    expect(vault.store.thumbs.get('p1_t')).toEqual(new Uint8Array([9]));
  });

  it('rejects a wrong password before touching anything', async () => {
    const bytes = await makeBackup();
    await expect(service.inspect(reader(bytes), 'wrong password', 99)).rejects.toThrow(
      WrongPasswordError,
    );
  });

  it('detects tampering anywhere in the file', async () => {
    const bytes = await makeBackup();
    const tampered = bytes.slice();
    tampered[tampered.length - 3]! ^= 0xff; // inside the last photo record
    await expect(service.inspect(reader(tampered), 'correct horse', 99)).rejects.toThrow(
      InvalidBackupError,
    );
  });

  it('refuses backups made by a newer app before erasing anything', async () => {
    const bytes = await makeBackup();
    await expect(service.inspect(reader(bytes), 'correct horse', 1)).rejects.toThrow(
      IncompatibleDumpError,
    );
  });

  it('requires a minimum password length', async () => {
    const db = await createTestDatabase();
    await expect(service.create(db, memoryVault(), 'short', memoryFile().sink)).rejects.toThrow(
      InvalidBackupError,
    );
  });
});
