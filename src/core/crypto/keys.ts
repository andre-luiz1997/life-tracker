import { getSecret, type SecureKey, SecureKeys, setSecret } from '@/core/secure-store';
import { bytesToHex, hexToBytes } from '@/shared/lib/bytes';

import { generateKey, KEY_LENGTH } from './aes-gcm';

async function getOrCreateKey(name: SecureKey): Promise<Uint8Array> {
  const stored = await getSecret(name);
  if (stored) {
    const key = hexToBytes(stored);
    if (key.length !== KEY_LENGTH) throw new Error(`Corrupted key: ${name}`);
    return key;
  }
  const key = generateKey();
  await setSecret(name, bytesToHex(key));
  return key;
}

/** Key used to encrypt photo files. */
export function getMasterKey(): Promise<Uint8Array> {
  return getOrCreateKey(SecureKeys.masterKey);
}

/** SQLCipher raw key. */
export function getDatabaseKey(): Promise<Uint8Array> {
  return getOrCreateKey(SecureKeys.dbKey);
}
