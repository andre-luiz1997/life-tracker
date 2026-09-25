import {
  type BackupHeader,
  InvalidBackupError,
  readHeader,
  readRecord,
  writeHeader,
  writeRecord,
} from './container';

/** In-memory stand-in for expo-file-system's FileHandle. */
function memoryFile(initial?: Uint8Array) {
  const chunks: Uint8Array[] = [];
  let data = initial ?? new Uint8Array();
  let offset = 0;
  return {
    writeBytes: (b: Uint8Array) => chunks.push(b.slice()),
    readBytes: (n: number) => {
      const out = data.slice(offset, offset + n);
      offset += out.length;
      return out;
    },
    bytes: () => {
      const total = chunks.reduce((s, c) => s + c.length, 0);
      data = new Uint8Array(total);
      let o = 0;
      for (const c of chunks) {
        data.set(c, o);
        o += c.length;
      }
      return data;
    },
  };
}

const header: BackupHeader = {
  format: 'ltbackup',
  createdAt: '2026-09-25T12:00:00.000Z',
  appVersion: '1.0.0',
  schemaVersion: 2,
  kdf: { algorithm: 'pbkdf2-sha256', iterations: 600_000, salt: 'abcd' },
};

describe('backup container', () => {
  it('round-trips the header and records', () => {
    const out = memoryFile();
    writeHeader(out, header);
    writeRecord(out, 'data', new Uint8Array([1, 2, 3]));
    writeRecord(out, 'photos/ação', new Uint8Array(70_000).fill(7));

    const input = memoryFile(out.bytes());
    expect(readHeader(input)).toEqual(header);
    expect(readRecord(input)).toEqual({ name: 'data', data: new Uint8Array([1, 2, 3]) });
    const big = readRecord(input)!;
    expect(big.name).toBe('photos/ação');
    expect(big.data.length).toBe(70_000);
    expect(readRecord(input)).toBeNull();
  });

  it('rejects other files and truncated backups', () => {
    expect(() => readHeader(memoryFile(new TextEncoder().encode('PK\u0003\u0004zip')))).toThrow(
      InvalidBackupError,
    );

    const out = memoryFile();
    writeHeader(out, header);
    writeRecord(out, 'data', new Uint8Array(100));
    const truncated = memoryFile(out.bytes().slice(0, -10));
    readHeader(truncated);
    expect(() => readRecord(truncated)).toThrow(InvalidBackupError);
  });

  it('rejects unsupported versions', () => {
    const out = memoryFile();
    writeHeader(out, header);
    const bytes = out.bytes();
    bytes[4] = 9;
    expect(() => readHeader(memoryFile(bytes))).toThrow('Unsupported version 9');
  });
});
