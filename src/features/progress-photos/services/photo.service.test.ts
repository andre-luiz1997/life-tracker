import type { AppDatabase } from '@/core/db';
import { createTestDatabase } from '@/test/db';

import { entries, photos } from '../db/progress-photos.schema';
import * as photosRepo from '../repositories/photos.repository';
import * as timelinesRepo from '../repositories/timelines.repository';
import { createPhotoService, type PhotoService } from './photo.service';
import { createTimelineService } from './timeline.service';

/** In-memory stand-in for the encrypted file store. */
function createMemoryFiles() {
  const store = { photos: new Map<string, Uint8Array>(), thumbs: new Map<string, Uint8Array>() };
  return {
    store,
    write: jest.fn(async (area: 'photos' | 'thumbs', name: string, bytes: Uint8Array) => {
      store[area].set(name, bytes);
    }),
    remove: jest.fn((area: 'photos' | 'thumbs', name: string) => {
      store[area].delete(name);
    }),
    list: (area: 'photos' | 'thumbs') => [...store[area].keys()],
  };
}

describe('photo.service', () => {
  let db: AppDatabase;
  let files: ReturnType<typeof createMemoryFiles>;
  let service: PhotoService;
  let discardSource: jest.Mock;
  let timelineId: string;
  let angleIds: string[];

  beforeEach(async () => {
    db = await createTestDatabase();
    files = createMemoryFiles();
    discardSource = jest.fn();
    service = createPhotoService({
      db,
      files,
      discardSource,
      processImage: async (uri) => ({
        full: { bytes: new TextEncoder().encode(`full:${uri}`), width: 1920, height: 2560 },
        thumb: { bytes: new TextEncoder().encode(`thumb:${uri}`) },
      }),
    });
    const timelines = createTimelineService({ db, files, translate: (k) => k });
    timelineId = timelines.create({ templateKey: 'face', title: 'Rosto', color: '#000' });
    angleIds = timelinesRepo.listAngles(db, timelineId).map((a) => a.id);
  });

  it('creates an entry, stores both files and discards the plaintext source', async () => {
    const takenAt = new Date(2026, 8, 25, 8, 30);
    const { entryId, photoId } = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'file:///cache/a.jpg',
      source: 'camera',
      entry: { takenAt, note: 'Dia 1' },
    });

    expect(photosRepo.getEntry(db, entryId)).toMatchObject({ timelineId, takenAt, note: 'Dia 1' });
    const photo = photosRepo.getPhoto(db, photoId)!;
    expect(photo).toMatchObject({ entryId, width: 1920, height: 2560, source: 'camera' });
    expect(files.store.photos.has(photo.fileName)).toBe(true);
    expect(files.store.thumbs.has(photo.thumbFileName)).toBe(true);
    expect(discardSource).toHaveBeenCalledWith('file:///cache/a.jpg');
  });

  it('adds more angles to the same entry (capture session)', async () => {
    const first = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'a',
      source: 'camera',
      entry: { takenAt: new Date() },
    });
    await service.save({
      timelineId,
      angleId: angleIds[1]!,
      sourceUri: 'b',
      source: 'camera',
      entry: { id: first.entryId },
    });

    expect(db.select().from(entries).all()).toHaveLength(1);
    expect(photosRepo.listEntryPhotos(db, first.entryId)).toHaveLength(2);
  });

  it('replaces the photo when retaking an angle in the same entry', async () => {
    const first = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'a',
      source: 'camera',
      entry: { takenAt: new Date() },
    });
    const old = photosRepo.getPhoto(db, first.photoId)!;

    const retake = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'b',
      source: 'camera',
      entry: { id: first.entryId },
    });

    expect(photosRepo.listEntryPhotos(db, first.entryId).map((p) => p.id)).toEqual([
      retake.photoId,
    ]);
    expect(files.store.photos.has(old.fileName)).toBe(false);
    expect(files.store.thumbs.has(old.thumbFileName)).toBe(false);
  });

  it('removes the new files when the database write fails', async () => {
    await expect(
      service.save({
        timelineId,
        angleId: 'missing-angle', // violates the foreign key
        sourceUri: 'a',
        source: 'gallery',
        entry: { takenAt: new Date() },
      }),
    ).rejects.toThrow();

    expect(files.store.photos.size).toBe(0);
    expect(files.store.thumbs.size).toBe(0);
    expect(db.select().from(entries).all()).toHaveLength(0);
    expect(discardSource).toHaveBeenCalledWith('a');
  });

  it('discards the source even when processing fails', async () => {
    const failing = createPhotoService({
      db,
      files,
      discardSource,
      processImage: async () => {
        throw new Error('decode failed');
      },
    });
    await expect(
      failing.save({
        timelineId,
        angleId: angleIds[0]!,
        sourceUri: 'x',
        source: 'camera',
        entry: { takenAt: new Date() },
      }),
    ).rejects.toThrow('decode failed');
    expect(discardSource).toHaveBeenCalledWith('x');
    expect(files.write).not.toHaveBeenCalled();
  });

  it('deletes the entry together with its last photo', async () => {
    const a = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'a',
      source: 'camera',
      entry: { takenAt: new Date() },
    });
    const b = await service.save({
      timelineId,
      angleId: angleIds[1]!,
      sourceUri: 'b',
      source: 'camera',
      entry: { id: a.entryId },
    });

    service.deletePhoto(a.photoId);
    expect(photosRepo.getEntry(db, a.entryId)).toBeDefined();
    service.deletePhoto(b.photoId);
    expect(photosRepo.getEntry(db, a.entryId)).toBeUndefined();
    expect(files.store.photos.size).toBe(0);
  });

  it('finds the latest photo of an angle for the ghost overlay', async () => {
    const angle = angleIds[0]!;
    const older = await service.save({
      timelineId,
      angleId: angle,
      sourceUri: 'a',
      source: 'camera',
      entry: { takenAt: new Date(2026, 0, 1) },
    });
    const newer = await service.save({
      timelineId,
      angleId: angle,
      sourceUri: 'b',
      source: 'camera',
      entry: { takenAt: new Date(2026, 5, 1) },
    });

    expect(photosRepo.getLatestPhotoOfAngle(db, angle)?.id).toBe(newer.photoId);
    // While retaking inside the newest entry, the ghost is the previous session.
    expect(photosRepo.getLatestPhotoOfAngle(db, angle, newer.entryId)?.id).toBe(older.photoId);
    expect(photosRepo.getLatestPhotoOfAngle(db, angleIds[1]!)).toBeUndefined();
  });

  it('removes orphan files', async () => {
    const saved = await service.save({
      timelineId,
      angleId: angleIds[0]!,
      sourceUri: 'a',
      source: 'camera',
      entry: { takenAt: new Date() },
    });
    files.store.photos.set('orphan', new Uint8Array());
    files.store.thumbs.set('orphan_t', new Uint8Array());

    expect(service.removeOrphanFiles()).toBe(2);
    expect([...files.store.photos.keys()]).toEqual([
      photosRepo.getPhoto(db, saved.photoId)!.fileName,
    ]);
    expect(db.select().from(photos).all()).toHaveLength(1);
  });
});
