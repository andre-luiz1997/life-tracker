import { decrypt, DecryptionError, deriveKey, encrypt, randomKeyBytes } from '@/core/crypto';
import {
  type AppDatabase,
  type DatabaseDump,
  dumpDatabase,
  importDump,
  IncompatibleDumpError,
} from '@/core/db';
import type { SecureFileStore, VaultArea } from '@/core/storage';
import { bytesToHex, hexToBytes, utf8Decode, utf8Encode } from '@/shared/lib/bytes';

import {
  type BackupHeader,
  type ByteSink,
  type ByteSource,
  InvalidBackupError,
  readHeader,
  readRecord,
  writeHeader,
  writeRecord,
} from '../lib/container';

/** Backup files leave the device: OWASP 2023 cost for PBKDF2-HMAC-SHA256. */
export const BACKUP_KDF_ITERATIONS = 600_000;
export const BACKUP_PASSWORD_MIN_LENGTH = 8;
const AREAS: VaultArea[] = ['photos', 'thumbs'];
const DATA_RECORD = 'data';

export class WrongPasswordError extends Error {
  override name = 'WrongPasswordError';
}

type Files = Pick<SecureFileStore, 'list' | 'read' | 'write'>;

type Deps = {
  appVersion: string;
  iterations?: number;
  now?: () => Date;
  onProgress?: (done: number, total: number) => void;
};

export type BackupSummary = { createdAt: Date; photoCount: number };

const recordName = (area: VaultArea, name: string) => `${area}/${name}`;
const aad = (name: string) => utf8Encode(`ltbackup/${name}`);

function parseRecordName(name: string): { area: VaultArea; file: string } | null {
  const [area, ...rest] = name.split('/');
  const file = rest.join('/');
  return AREAS.includes(area as VaultArea) && file ? { area: area as VaultArea, file } : null;
}

export function createBackupService({
  appVersion,
  iterations = BACKUP_KDF_ITERATIONS,
  now = () => new Date(),
  onProgress,
}: Deps) {
  async function keyFor(header: BackupHeader, password: string) {
    return deriveKey(password, hexToBytes(header.kdf.salt), header.kdf.iterations);
  }

  /** Reads and authenticates the whole file. Returns the decrypted dump. */
  async function readAll(
    source: ByteSource,
    password: string,
    onFile?: (area: VaultArea, name: string, plaintext: Uint8Array) => Promise<void>,
  ): Promise<{ header: BackupHeader; dump: DatabaseDump; photoCount: number }> {
    const header = readHeader(source);
    const key = await keyFor(header, password);

    const first = readRecord(source);
    if (!first || first.name !== DATA_RECORD) throw new InvalidBackupError('Missing data');
    let dump: DatabaseDump;
    try {
      dump = JSON.parse(utf8Decode(decrypt(key, first.data, aad(DATA_RECORD))));
    } catch (error) {
      // The first record is the password check: GCM fails with a wrong key.
      if (error instanceof DecryptionError) throw new WrongPasswordError();
      throw new InvalidBackupError('Corrupted data');
    }

    let photoCount = 0;
    for (let record = readRecord(source); record; record = readRecord(source)) {
      const target = parseRecordName(record.name);
      if (!target) continue;
      let plaintext: Uint8Array;
      try {
        plaintext = decrypt(key, record.data, aad(record.name));
      } catch {
        throw new InvalidBackupError(`Corrupted file: ${record.name}`);
      }
      if (target.area === 'photos') photoCount++;
      await onFile?.(target.area, target.file, plaintext);
    }
    return { header, dump, photoCount };
  }

  return {
    /** Writes a full encrypted backup to `sink`. Photos are streamed one at a time. */
    async create(db: AppDatabase, files: Files, password: string, sink: ByteSink) {
      if (password.length < BACKUP_PASSWORD_MIN_LENGTH)
        throw new InvalidBackupError('Password too short');
      const salt = randomKeyBytes(16);
      const key = await deriveKey(password, salt, iterations);
      const dump = dumpDatabase(db);

      writeHeader(sink, {
        format: 'ltbackup',
        createdAt: now().toISOString(),
        appVersion,
        schemaVersion: dump.schemaVersion,
        kdf: { algorithm: 'pbkdf2-sha256', iterations, salt: bytesToHex(salt) },
      });
      writeRecord(
        sink,
        DATA_RECORD,
        encrypt(key, utf8Encode(JSON.stringify(dump)), aad(DATA_RECORD)),
      );

      const all = AREAS.flatMap((area) => files.list(area).map((name) => ({ area, name })));
      for (const [i, { area, name }] of all.entries()) {
        // Decrypt with the device key, re-encrypt with the backup key.
        const plaintext = await files.read(area, name);
        writeRecord(
          sink,
          recordName(area, name),
          encrypt(key, plaintext, aad(recordName(area, name))),
        );
        onProgress?.(i + 1, all.length);
      }
    },

    /**
     * Checks compatibility, the password and every record's integrity without changing anything.
     * Everything that could make a restore fail must be caught here, before data is erased.
     */
    async inspect(
      openSource: () => ByteSource,
      password: string,
      currentSchemaVersion: number,
    ): Promise<BackupSummary> {
      const { header, photoCount } = await readAll(openSource(), password);
      if (header.schemaVersion > currentSchemaVersion)
        throw new IncompatibleDumpError('Backup is newer');
      return { createdAt: new Date(header.createdAt), photoCount };
    },

    /** Loads a backup into an empty, migrated database and an empty vault. */
    async restore(openSource: () => ByteSource, password: string, db: AppDatabase, files: Files) {
      const written: { area: VaultArea; name: string }[] = [];
      const { dump } = await readAll(openSource(), password, async (area, name, plaintext) => {
        await files.write(area, name, plaintext);
        written.push({ area, name });
      });
      importDump(db, dump);
      return written.length;
    },
  };
}

export type BackupService = ReturnType<typeof createBackupService>;
