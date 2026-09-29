import Constants from 'expo-constants';
import { File, FileMode, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import {
  appSettings,
  getDatabase,
  openMigratedDatabase,
  readSetting,
  schemaVersion,
  useDbQuery,
  writeSetting,
} from '@/core/db';
import { withExternalActivity } from '@/core/lifecycle';
import { eraseAllData } from '@/core/maintenance';
import { secureFileStore } from '@/core/storage';

import { createBackupService } from '../services/backup.service';

const LAST_BACKUP_KEY = 'backup.lastAt';

const service = (onProgress?: (done: number, total: number) => void) =>
  createBackupService({ appVersion: Constants.expoConfig?.version ?? '0', onProgress });

function sourceFor(file: File) {
  return () => {
    const handle = file.open(FileMode.ReadOnly);
    return { readBytes: (n: number) => handle.readBytes(n) };
  };
}

/** Creates the encrypted backup in the cache, opens the share sheet, then deletes the file. */
export async function exportBackup(
  password: string,
  dialogTitle: string,
  onProgress?: (done: number, total: number) => void,
) {
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `kronos-${date}.ltbackup`);
  file.create({ overwrite: true });
  const handle = file.open(FileMode.Truncate);
  try {
    await service(onProgress).create(getDatabase(), secureFileStore, password, handle);
  } catch (error) {
    handle.close();
    file.delete();
    throw error;
  }
  handle.close();
  try {
    await withExternalActivity(() =>
      shareAsync(file.uri, { dialogTitle, mimeType: 'application/octet-stream' }),
    );
    writeSetting(getDatabase(), LAST_BACKUP_KEY, new Date().toISOString());
  } finally {
    if (file.exists) file.delete();
  }
}

export async function pickBackupFile(): Promise<File | null> {
  const result = await withExternalActivity(() => File.pickFileAsync());
  return result.canceled ? null : result.result;
}

export function inspectBackup(file: File, password: string) {
  return service().inspect(sourceFor(file), password, schemaVersion(getDatabase()));
}

/**
 * Replaces all data with the backup. Must run inside useDatabaseRestart(): the backup was
 * already verified by inspectBackup, so failures here are unlikely (I/O).
 */
export async function restoreBackup(file: File, password: string) {
  // The picked file may live in the cache, which eraseAllData wipes: keep a copy outside it.
  const copy = new File(Paths.document, 'restoring.ltbackup');
  if (copy.exists) copy.delete();
  file.copy(copy);
  try {
    await eraseAllData();
    const db = await openMigratedDatabase();
    await service().restore(sourceFor(copy), password, db, secureFileStore);
  } finally {
    if (copy.exists) copy.delete();
  }
}

export function useLastBackupDate() {
  return useDbQuery(() => {
    const iso = readSetting<string | null>(getDatabase(), LAST_BACKUP_KEY, null);
    return iso ? new Date(iso) : null;
  }, [appSettings]);
}
