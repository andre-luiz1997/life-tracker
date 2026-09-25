import { utf8Decode, utf8Encode } from '@/shared/lib/bytes';

/**
 * .ltbackup container, written/read as a stream so photos never all sit in memory:
 *
 *   "LTBK" | u8 version | u32 headerLength | header (JSON, plaintext) | record*
 *   record = u16 nameLength | name (utf8) | u32 dataLength | data
 *
 * The header only holds what's needed to derive the key (KDF params, salt). Every record's
 * data is AES-GCM encrypted with the backup key and its name as AAD.
 */
export const MAGIC = utf8Encode('LTBK');
export const CONTAINER_VERSION = 1;

export type BackupHeader = {
  format: 'ltbackup';
  createdAt: string;
  appVersion: string;
  schemaVersion: number;
  kdf: { algorithm: 'pbkdf2-sha256'; iterations: number; salt: string };
};

export type ByteSink = { writeBytes: (bytes: Uint8Array) => void };
export type ByteSource = { readBytes: (length: number) => Uint8Array };

export class InvalidBackupError extends Error {
  override name = 'InvalidBackupError';
}

function u32(n: number) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n);
  return b;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n);
  return b;
}

export function writeHeader(sink: ByteSink, header: BackupHeader) {
  const json = utf8Encode(JSON.stringify(header));
  sink.writeBytes(MAGIC);
  sink.writeBytes(new Uint8Array([CONTAINER_VERSION]));
  sink.writeBytes(u32(json.length));
  sink.writeBytes(json);
}

export function writeRecord(sink: ByteSink, name: string, data: Uint8Array) {
  const n = utf8Encode(name);
  sink.writeBytes(u16(n.length));
  sink.writeBytes(n);
  sink.writeBytes(u32(data.length));
  sink.writeBytes(data);
}

function readExactly(source: ByteSource, length: number): Uint8Array {
  const bytes = source.readBytes(length);
  if (bytes.length !== length) throw new InvalidBackupError('Unexpected end of file');
  return bytes;
}

const view = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength);

export function readHeader(source: ByteSource): BackupHeader {
  const magic = source.readBytes(MAGIC.length);
  if (magic.length !== MAGIC.length || magic.some((b, i) => b !== MAGIC[i])) {
    throw new InvalidBackupError('Not a Life Tracker backup');
  }
  const [version] = readExactly(source, 1);
  if (version !== CONTAINER_VERSION) throw new InvalidBackupError(`Unsupported version ${version}`);
  const length = view(readExactly(source, 4)).getUint32(0);
  if (length > 64 * 1024) throw new InvalidBackupError('Header too large');
  try {
    const header = JSON.parse(utf8Decode(readExactly(source, length))) as BackupHeader;
    if (header.format !== 'ltbackup' || !header.kdf?.salt) throw new Error();
    return header;
  } catch {
    throw new InvalidBackupError('Corrupted header');
  }
}

/** Next record, or null at the end of the file. */
export function readRecord(source: ByteSource): { name: string; data: Uint8Array } | null {
  const lengthBytes = source.readBytes(2);
  if (lengthBytes.length === 0) return null;
  if (lengthBytes.length !== 2) throw new InvalidBackupError('Unexpected end of file');
  const name = utf8Decode(readExactly(source, view(lengthBytes).getUint16(0)));
  const data = readExactly(source, view(readExactly(source, 4)).getUint32(0));
  return { name, data };
}
