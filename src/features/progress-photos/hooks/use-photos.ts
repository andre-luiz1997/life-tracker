import { useMemo } from 'react';

import { getDatabase, useDbQuery } from '@/core/db';
import { secureFileStore } from '@/core/storage';

import { discardTempImage, processImage } from '../capture/image-processing';
import { entries, photos } from '../db/progress-photos.schema';
import * as repo from '../repositories/photos.repository';
import { createPhotoService } from '../services/photo.service';

export function usePhotoService() {
  return useMemo(
    () =>
      createPhotoService({
        db: getDatabase(),
        files: secureFileStore,
        processImage,
        discardSource: discardTempImage,
      }),
    [],
  );
}

/** Entry (if any) and its photos, for the capture session checklist. */
export function useEntryPhotos(entryId: string | null) {
  return useDbQuery(
    () => {
      if (!entryId) return { entry: null, photos: [] };
      const db = getDatabase();
      return {
        entry: repo.getEntry(db, entryId) ?? null,
        photos: repo.listEntryPhotos(db, entryId),
      };
    },
    [entries, photos],
    [entryId],
  );
}

/** Latest photo of the angle from a previous session: the "ghost" overlay. */
export function useGhostPhoto(angleId: string, currentEntryId: string | null) {
  return useDbQuery(
    () => repo.getLatestPhotoOfAngle(getDatabase(), angleId, currentEntryId ?? undefined) ?? null,
    [photos, entries],
    [angleId, currentEntryId],
  );
}
