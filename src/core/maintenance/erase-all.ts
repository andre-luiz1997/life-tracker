import { Directory, Paths } from 'expo-file-system';
import { deleteDatabaseSync } from 'expo-sqlite';

import { closeDatabase, DATABASE_NAME } from '@/core/db/client';
import { deleteSecret, SecureKeys } from '@/core/secure-store';
import { secureFileStore } from '@/core/storage';

/**
 * Irreversibly deletes everything: database, encrypted files, temp files and keys. New keys
 * and an empty database are created on the next open. Run inside `useDatabaseRestart()`.
 */
export async function eraseAllData(): Promise<void> {
  closeDatabase();
  try {
    deleteDatabaseSync(DATABASE_NAME);
  } catch {
    // Already gone.
  }

  const vault = new Directory(Paths.document, 'vault');
  if (vault.exists) vault.delete();
  secureFileStore.clearDecryptedCache();
  for (const entry of new Directory(Paths.cache).list()) {
    try {
      entry.delete();
    } catch {
      // Some OS-managed cache entries can't be deleted; they hold nothing of ours.
    }
  }

  await Promise.all(Object.values(SecureKeys).map((key) => deleteSecret(key)));
}
