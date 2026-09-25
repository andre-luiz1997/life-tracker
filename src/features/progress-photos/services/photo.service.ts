import type { AppDatabase } from '@/core/db';
import type { SecureFileStore } from '@/core/storage';
import { uuidv7 } from '@/shared/lib/id';

import type { Photo } from '../db/progress-photos.schema';
import * as repo from '../repositories/photos.repository';

/** JPEG bytes ready to be encrypted: the resized photo and its thumbnail. */
export type ProcessedImage = {
  full: { bytes: Uint8Array; width: number; height: number };
  thumb: { bytes: Uint8Array };
};

type Deps = {
  db: AppDatabase;
  files: Pick<SecureFileStore, 'write' | 'remove' | 'list'>;
  /** Resizes/encodes the source image (see capture/image-processing.ts). */
  processImage: (uri: string, size?: { width: number; height: number }) => Promise<ProcessedImage>;
  /** Deletes the plaintext temp file (camera cache / picker copy). */
  discardSource: (uri: string) => void;
};

export type SavePhotoInput = {
  timelineId: string;
  angleId: string;
  sourceUri: string;
  /** Source dimensions when known (avoids decoding huge images just to measure them). */
  sourceSize?: { width: number; height: number };
  source: Photo['source'];
  /** Already rendered by the editor: skips `processImage`. */
  image?: ProcessedImage;
  /** Existing entry (same capture session) or a new one taken at `takenAt`. */
  entry: { id: string } | { takenAt: Date; note?: string };
};

export type SavePhotoResult = { entryId: string; photoId: string };

export function createPhotoService({ db, files, processImage, discardSource }: Deps) {
  function removeFiles(photo: { fileName: string; thumbFileName: string }) {
    files.remove('photos', photo.fileName);
    files.remove('thumbs', photo.thumbFileName);
  }

  return {
    /**
     * Pipeline: process → encrypt + write files → SQL transaction → delete plaintext source.
     * If the transaction fails the new files are removed, so no orphans are left behind.
     * Saving an angle that already has a photo in the entry replaces it (retake).
     */
    async save(input: SavePhotoInput): Promise<SavePhotoResult> {
      const photoId = uuidv7();
      const fileName = photoId;
      const thumbFileName = `${photoId}_t`;

      try {
        const image = input.image ?? (await processImage(input.sourceUri, input.sourceSize));
        await files.write('photos', fileName, image.full.bytes);
        await files.write('thumbs', thumbFileName, image.thumb.bytes);

        let replaced: Photo | undefined;
        let entryId: string;
        try {
          entryId = db.transaction((tx) => {
            let id: string;
            if ('id' in input.entry) {
              id = input.entry.id;
              replaced = repo.findPhotoInEntry(tx, id, input.angleId);
              if (replaced) repo.deletePhoto(tx, replaced.id);
            } else {
              id = uuidv7();
              repo.insertEntry(tx, {
                id,
                timelineId: input.timelineId,
                takenAt: input.entry.takenAt,
                note: input.entry.note ?? null,
              });
            }
            repo.insertPhoto(tx, {
              id: photoId,
              entryId: id,
              angleId: input.angleId,
              fileName,
              thumbFileName,
              width: image.full.width,
              height: image.full.height,
              source: input.source,
            });
            return id;
          });
        } catch (error) {
          removeFiles({ fileName, thumbFileName });
          throw error;
        }

        if (replaced) removeFiles(replaced);
        return { entryId, photoId };
      } finally {
        discardSource(input.sourceUri);
      }
    },

    /** Deletes a photo; the entry goes too when it was its last photo. */
    deletePhoto(photoId: string) {
      const photo = db.transaction((tx) => {
        const found = repo.getPhoto(tx, photoId);
        if (!found) return undefined;
        repo.deletePhoto(tx, photoId);
        if (!repo.listEntryPhotos(tx, found.entryId).length) repo.deleteEntry(tx, found.entryId);
        return found;
      });
      if (photo) removeFiles(photo);
    },

    /** Removes encrypted files with no database row (e.g. app killed mid-save). */
    removeOrphanFiles(): number {
      const referenced = repo.listAllPhotoFileNames(db);
      const known = {
        photos: new Set(referenced.map((r) => r.fileName)),
        thumbs: new Set(referenced.map((r) => r.thumbFileName)),
      };
      let removed = 0;
      for (const area of ['photos', 'thumbs'] as const) {
        for (const name of files.list(area)) {
          if (!known[area].has(name)) {
            files.remove(area, name);
            removed++;
          }
        }
      }
      return removed;
    },
  };
}

export type PhotoService = ReturnType<typeof createPhotoService>;
