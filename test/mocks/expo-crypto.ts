import { webcrypto } from 'node:crypto';

export function getRandomValues<T extends Uint8Array>(array: T): T {
  return webcrypto.getRandomValues(array);
}
