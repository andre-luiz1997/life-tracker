import { useMemo } from 'react';

import { getDatabase, useDbQuery } from '@/core/db';
import { secureFileStore } from '@/core/storage';

import { discardTempImage, processImage } from '../capture/image-processing';
import { entries, metricValues, type Photo, photos } from '../db/progress-photos.schema';
import * as repo from '../repositories/photos.repository';
import { createEntryService } from '../services/entry.service';
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

export function useEntryService() {
  return useMemo(() => createEntryService({ db: getDatabase(), files: secureFileStore }), []);
}

/** Everything the timeline list needs, refreshed on any change. */
export function useTimelineFeed(timelineId: string) {
  return useDbQuery(
    () => {
      const db = getDatabase();
      const photosByEntry = new Map<string, Photo[]>();
      for (const photo of repo.listPhotosOfTimeline(db, timelineId)) {
        photosByEntry.set(photo.entryId, [...(photosByEntry.get(photo.entryId) ?? []), photo]);
      }
      const valuesByEntry = new Map<string, Map<string, number>>();
      for (const { value } of repo.listMetricValuesOfTimeline(db, timelineId)) {
        const map = valuesByEntry.get(value.entryId) ?? new Map<string, number>();
        map.set(value.metricId, value.value);
        valuesByEntry.set(value.entryId, map);
      }
      return { entries: repo.listEntries(db, timelineId), photosByEntry, valuesByEntry };
    },
    [entries, photos, metricValues],
    [timelineId],
  );
}

export function useAnglePhotos(angleId: string) {
  return useDbQuery(
    () => repo.listPhotosOfAngle(getDatabase(), angleId),
    [photos, entries],
    [angleId],
  );
}

export function useEntryDetails(entryId: string) {
  return useDbQuery(
    () => {
      const db = getDatabase();
      const entry = repo.getEntry(db, entryId);
      if (!entry) return null;
      return {
        entry,
        photos: repo.listEntryPhotos(db, entryId),
        values: repo.listMetricValuesOfEntry(db, entryId),
      };
    },
    [entries, photos, metricValues],
    [entryId],
  );
}

export function useMetricHistory(timelineId: string) {
  return useDbQuery(
    () => repo.listMetricValuesOfTimeline(getDatabase(), timelineId),
    [metricValues, entries],
    [timelineId],
  );
}

export function useCoverThumb(timelineId: string) {
  return useDbQuery(
    () => repo.getCoverThumb(getDatabase(), timelineId),
    [photos, entries],
    [timelineId],
  );
}
