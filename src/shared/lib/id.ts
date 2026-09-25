import { getRandomValues } from 'expo-crypto';

import { bytesToHex } from './bytes';

/**
 * UUID v7 (RFC 9562): 48-bit Unix ms timestamp + random bits. Time-ordered, which keeps
 * indexes compact and makes future sync/merge simpler.
 */
export function uuidv7(now: number = Date.now()): string {
  const bytes = getRandomValues(new Uint8Array(16));

  let ts = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant 10

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
