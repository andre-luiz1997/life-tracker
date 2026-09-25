import * as SecureStore from 'expo-secure-store';

/** Never synced to iCloud/Google backups and only readable while the device is unlocked. */
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const SecureKeys = {
  masterKey: 'lt.master-key.v1',
  dbKey: 'lt.db-key.v1',
  pinHash: 'lt.pin-hash.v1',
} as const;

export type SecureKey = (typeof SecureKeys)[keyof typeof SecureKeys];

export function getSecret(key: SecureKey): Promise<string | null> {
  return SecureStore.getItemAsync(key, OPTIONS);
}

export function setSecret(key: SecureKey, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value, OPTIONS);
}

export function deleteSecret(key: SecureKey): Promise<void> {
  return SecureStore.deleteItemAsync(key, OPTIONS);
}
