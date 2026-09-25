import type { AppDatabase } from '@/core/db';
import type { SecureFileStore } from '@/core/storage';
import { uuidv7 } from '@/shared/lib/id';

import * as repo from '../repositories/photos.repository';

type Deps = { db: AppDatabase; files: Pick<SecureFileStore, 'remove'> };

export function createEntryService({ db, files }: Deps) {
  return {
    update(id: string, values: { takenAt?: Date; note?: string | null }) {
      const note = values.note === undefined ? undefined : values.note?.trim() || null;
      repo.updateEntry(db, id, { takenAt: values.takenAt, note });
    },

    /** Sets metric values for an entry; `null` clears a value. Atomic. */
    setMetricValues(entryId: string, values: Record<string, number | null>) {
      db.transaction((tx) => {
        for (const [metricId, value] of Object.entries(values)) {
          if (value === null || !Number.isFinite(value)) {
            repo.deleteMetricValue(tx, entryId, metricId);
          } else {
            repo.upsertMetricValue(tx, { id: uuidv7(), entryId, metricId, value });
          }
        }
      });
    },

    /** Deletes the entry, its photos (rows cascade) and their encrypted files. */
    remove(id: string) {
      const list = repo.listEntryPhotos(db, id);
      repo.deleteEntry(db, id);
      for (const photo of list) {
        files.remove('photos', photo.fileName);
        files.remove('thumbs', photo.thumbFileName);
      }
    },
  };
}

export type EntryService = ReturnType<typeof createEntryService>;
