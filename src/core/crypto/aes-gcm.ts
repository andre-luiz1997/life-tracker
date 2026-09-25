import { Buffer, createCipheriv, createDecipheriv, randomBytes } from 'react-native-quick-crypto';

import { IV_LENGTH, packEnvelope, TAG_LENGTH, unpackEnvelope } from './envelope';

const ALGORITHM = 'aes-256-gcm';
export const KEY_LENGTH = 32;

export class DecryptionError extends Error {
  override name = 'DecryptionError';
}

function assertKey(key: Uint8Array) {
  if (key.length !== KEY_LENGTH) throw new Error(`AES-256 key must be ${KEY_LENGTH} bytes`);
}

/** Zero-copy view as Buffer, for APIs typed to accept only Buffer. */
function asBuffer(bytes: Uint8Array) {
  return Buffer.from(bytes.buffer as ArrayBuffer, bytes.byteOffset, bytes.byteLength);
}

function toBytes(buf: { buffer: ArrayBufferLike; byteOffset: number; byteLength: number }) {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function generateKey(): Uint8Array {
  return randomKeyBytes(KEY_LENGTH);
}

export function randomKeyBytes(length: number): Uint8Array {
  return toBytes(randomBytes(length));
}

/** Encrypts with a fresh random IV. Output: [version | iv | tag | ciphertext]. */
export function encrypt(key: Uint8Array, plaintext: Uint8Array, aad?: Uint8Array): Uint8Array {
  assertKey(key);
  const iv = randomKeyBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  if (aad) cipher.setAAD(asBuffer(aad));
  const head = toBytes(cipher.update(plaintext));
  const tail = toBytes(cipher.final());
  const tag = toBytes(cipher.getAuthTag());

  const ciphertext = new Uint8Array(head.length + tail.length);
  ciphertext.set(head, 0);
  ciphertext.set(tail, head.length);
  return packEnvelope({ iv, tag, ciphertext });
}

/** Decrypts and authenticates. Throws DecryptionError on a wrong key or tampered data. */
export function decrypt(key: Uint8Array, data: Uint8Array, aad?: Uint8Array): Uint8Array {
  assertKey(key);
  const { iv, tag, ciphertext } = unpackEnvelope(data);
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    if (aad) decipher.setAAD(asBuffer(aad));
    decipher.setAuthTag(asBuffer(tag));
    const head = toBytes(decipher.update(ciphertext));
    const tail = toBytes(decipher.final());
    const out = new Uint8Array(head.length + tail.length);
    out.set(head, 0);
    out.set(tail, head.length);
    return out;
  } catch (cause) {
    throw new DecryptionError('Unable to decrypt payload', { cause });
  }
}
