import { pbkdf2 } from 'react-native-quick-crypto';

import { bytesToHex, hexToBytes, timingSafeEqual, utf8Encode } from '@/shared/lib/bytes';

import { randomKeyBytes } from './aes-gcm';

/**
 * PIN hashing cost (plan: ≥ 210k). OWASP 2023 recommends 600k for PBKDF2-HMAC-SHA256; for a
 * 4–6 digit PIN stored in the Keychain/Keystore, extra iterations mostly add unlock latency.
 * Backup passwords, which protect files that leave the device, use BACKUP_KDF_ITERATIONS.
 */
export const PBKDF2_ITERATIONS = 210_000;
const DIGEST = 'sha256';
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
const PREFIX = 'pbkdf2-sha256';

export function deriveKey(
  secret: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
  keyLength = HASH_LENGTH,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    pbkdf2(utf8Encode(secret), salt, iterations, keyLength, DIGEST, (err, key) => {
      if (err || !key) return reject(err ?? new Error('pbkdf2 failed'));
      resolve(new Uint8Array(key.buffer, key.byteOffset, key.byteLength));
    });
  });
}

/** Returns a self-describing record: `pbkdf2-sha256$<iterations>$<saltHex>$<hashHex>`. */
export async function hashSecret(secret: string, iterations = PBKDF2_ITERATIONS): Promise<string> {
  const salt = randomKeyBytes(SALT_LENGTH);
  const hash = await deriveKey(secret, salt, iterations);
  return [PREFIX, iterations, bytesToHex(salt), bytesToHex(hash)].join('$');
}

export async function verifySecret(secret: string, record: string): Promise<boolean> {
  const [prefix, iterations, saltHex, hashHex] = record.split('$');
  if (prefix !== PREFIX || !iterations || !saltHex || !hashHex) return false;
  const expected = hexToBytes(hashHex);
  const actual = await deriveKey(secret, hexToBytes(saltHex), Number(iterations), expected.length);
  return timingSafeEqual(actual, expected);
}
