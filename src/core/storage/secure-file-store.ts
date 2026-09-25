import { Directory, File, Paths } from 'expo-file-system';
import { fromByteArray } from 'react-native-quick-base64';

import { decrypt, encrypt } from '@/core/crypto';
import { utf8Encode } from '@/shared/lib/bytes';

/** Top-level folders inside the app sandbox (Paths.document is never purged by the OS). */
export type VaultArea = 'photos' | 'thumbs';

const VAULT_ROOT = 'vault';
const DECRYPTED_CACHE = 'decrypted';

function areaDir(area: VaultArea): Directory {
  const dir = new Directory(Paths.document, VAULT_ROOT, area);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Binds the ciphertext to its location, so files can't be swapped between areas/names. */
function aadFor(area: VaultArea, name: string) {
  return utf8Encode(`${area}/${name}`);
}

export function createSecureFileStore(getKey: () => Promise<Uint8Array>) {
  const store = {
    async write(area: VaultArea, name: string, plaintext: Uint8Array): Promise<void> {
      const key = await getKey();
      const file = new File(areaDir(area), `${name}.enc`);
      file.create({ overwrite: true });
      file.write(encrypt(key, plaintext, aadFor(area, name)));
    },

    async read(area: VaultArea, name: string): Promise<Uint8Array> {
      const key = await getKey();
      const file = new File(areaDir(area), `${name}.enc`);
      return decrypt(key, await file.bytes(), aadFor(area, name));
    },

    /** Decrypts into memory as a data URI (thumbnails: small, never touch the disk). */
    async readAsDataUri(area: VaultArea, name: string, mime = 'image/jpeg'): Promise<string> {
      return `data:${mime};base64,${fromByteArray(await store.read(area, name))}`;
    },

    remove(area: VaultArea, name: string): void {
      const file = new File(areaDir(area), `${name}.enc`);
      if (file.exists) file.delete();
    },

    /** Names (without extension) of all stored files, used by the orphan cleanup routine. */
    list(area: VaultArea): string[] {
      return areaDir(area)
        .list()
        .filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.enc'))
        .map((f) => f.name.slice(0, -'.enc'.length));
    },

    /**
     * Decrypts to a temp file for components that need a URI (full-size viewer).
     * Callers must call clearDecryptedCache() when leaving the screen / backgrounding.
     */
    async decryptToCache(area: VaultArea, name: string, extension = 'jpg'): Promise<string> {
      const dir = new Directory(Paths.cache, DECRYPTED_CACHE);
      if (!dir.exists) dir.create({ intermediates: true });
      const file = new File(dir, `${name}.${extension}`);
      file.create({ overwrite: true });
      file.write(await store.read(area, name));
      return file.uri;
    },

    clearDecryptedCache(): void {
      const dir = new Directory(Paths.cache, DECRYPTED_CACHE);
      if (dir.exists) dir.delete();
    },
  };
  return store;
}

export type SecureFileStore = ReturnType<typeof createSecureFileStore>;
