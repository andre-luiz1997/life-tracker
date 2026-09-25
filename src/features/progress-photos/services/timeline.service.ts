import type { AppDatabase, DbExecutor } from '@/core/db';
import type { SecureFileStore } from '@/core/storage';
import { uuidv7 } from '@/shared/lib/id';

import type { TemplateKey } from '../db/progress-photos.schema';
import * as repo from '../repositories/timelines.repository';
import { getTemplate } from '../templates';

export type TimelineErrorCode = 'not_found' | 'last_active_angle';

export class TimelineError extends Error {
  override name = 'TimelineError';
  constructor(readonly code: TimelineErrorCode) {
    super(code);
  }
}

type Deps = {
  db: AppDatabase;
  files: Pick<SecureFileStore, 'remove'>;
  /** Resolves template labels, e.g. `photos:angles.body_front`. */
  translate: (key: string) => string;
};

export type CreateTimelineInput = { templateKey: TemplateKey; title: string; color: string };
export type Direction = 'up' | 'down';

export function createTimelineService({ db, files, translate }: Deps) {
  function removePhotoFiles(list: { fileName: string; thumbFileName: string }[]) {
    for (const { fileName, thumbFileName } of list) {
      files.remove('photos', fileName);
      files.remove('thumbs', thumbFileName);
    }
  }

  function requireAngle(tx: DbExecutor, id: string) {
    const angle = repo.getAngle(tx, id);
    if (!angle) throw new TimelineError('not_found');
    return angle;
  }

  /** Swaps sort order with the neighbour in the given direction (no-op at the edges). */
  function move<T extends { id: string; sortOrder: number }>(
    list: T[],
    id: string,
    direction: Direction,
    save: (id: string, sortOrder: number) => void,
  ) {
    const index = list.findIndex((item) => item.id === id);
    const target = direction === 'up' ? index - 1 : index + 1;
    const current = list[index];
    const other = list[target];
    if (!current || !other) return;
    save(current.id, other.sortOrder);
    save(other.id, current.sortOrder);
  }

  return {
    create({ templateKey, title, color }: CreateTimelineInput): string {
      const template = getTemplate(templateKey);
      const id = uuidv7();

      db.transaction((tx) => {
        repo.insertTimeline(tx, {
          id,
          title: title.trim(),
          templateKey,
          color,
          icon: template.icon,
          // The template interval is only a suggestion: reminders need the user's opt-in
          // (and the notification permission), see setReminder.
          reminderIntervalDays: null,
        });
        repo.insertAngles(
          tx,
          template.angles.map((angle, i) => ({
            id: uuidv7(),
            timelineId: id,
            key: angle.key,
            label: translate(`photos:angles.${angle.key}`),
            overlayKey: angle.overlay ?? null,
            sortOrder: i,
            isActive: !angle.optional,
          })),
        );
        repo.insertMetrics(
          tx,
          template.metrics
            .filter((metric) => !metric.optional)
            .map((metric, i) => ({
              id: uuidv7(),
              timelineId: id,
              key: metric.key,
              label: translate(`photos:metrics.${metric.key}`),
              unit: metric.unit,
              sortOrder: i,
            })),
        );
      });
      return id;
    },

    update(id: string, values: { title?: string; color?: string }) {
      repo.updateTimeline(db, id, { ...values, title: values.title?.trim() });
    },

    /** `null` turns reminders off. */
    setReminder(id: string, reminder: { intervalDays: number; time: string } | null) {
      repo.updateTimeline(db, id, {
        reminderIntervalDays: reminder?.intervalDays ?? null,
        reminderTime: reminder?.time ?? null,
      });
    },

    setArchived(id: string, archived: boolean) {
      repo.updateTimeline(db, id, { archivedAt: archived ? new Date() : null });
    },

    /** Deletes the timeline (rows cascade) and then its encrypted files. */
    remove(id: string) {
      const photoFiles = repo.listPhotoFilesOfTimeline(db, id);
      repo.deleteTimeline(db, id);
      removePhotoFiles(photoFiles);
    },

    // Angles

    addAngle(timelineId: string, label: string): string {
      const id = uuidv7();
      const angles = repo.listAngles(db, timelineId);
      repo.insertAngles(db, [
        {
          id,
          timelineId,
          key: `custom_${id}`,
          label: label.trim(),
          sortOrder: Math.max(-1, ...angles.map((a) => a.sortOrder)) + 1,
          isActive: true,
        },
      ]);
      return id;
    },

    renameAngle(id: string, label: string) {
      repo.updateAngle(db, id, { label: label.trim() });
    },

    setAngleActive(id: string, isActive: boolean) {
      db.transaction((tx) => {
        const angle = requireAngle(tx, id);
        if (!isActive) {
          const active = repo.listAngles(tx, angle.timelineId).filter((a) => a.isActive);
          if (active.length <= 1 && angle.isActive) throw new TimelineError('last_active_angle');
        }
        repo.updateAngle(tx, id, { isActive });
      });
    },

    moveAngle(id: string, direction: Direction) {
      db.transaction((tx) => {
        const angle = requireAngle(tx, id);
        move(repo.listAngles(tx, angle.timelineId), id, direction, (angleId, sortOrder) =>
          repo.updateAngle(tx, angleId, { sortOrder }),
        );
      });
    },

    /** Deletes the angle and its photos. */
    removeAngle(id: string) {
      const photoFiles = db.transaction((tx) => {
        const angle = requireAngle(tx, id);
        const others = repo.listAngles(tx, angle.timelineId).filter((a) => a.id !== id);
        if (!others.some((a) => a.isActive)) throw new TimelineError('last_active_angle');
        const list = repo.listPhotoFilesOfAngle(tx, id);
        repo.deleteAngle(tx, id);
        return list;
      });
      removePhotoFiles(photoFiles);
    },

    // Metrics

    addMetric(
      timelineId: string,
      { label, unit, key }: { label: string; unit: string; key?: string },
    ) {
      const id = uuidv7();
      const metrics = repo.listMetrics(db, timelineId);
      repo.insertMetrics(db, [
        {
          id,
          timelineId,
          key: key ?? `custom_${id}`,
          label: label.trim(),
          unit: unit.trim(),
          sortOrder: Math.max(-1, ...metrics.map((m) => m.sortOrder)) + 1,
        },
      ]);
      return id;
    },

    updateMetric(id: string, values: { label?: string; unit?: string }) {
      repo.updateMetric(db, id, { label: values.label?.trim(), unit: values.unit?.trim() });
    },

    moveMetric(id: string, direction: Direction) {
      db.transaction((tx) => {
        const metric = repo.getMetric(tx, id);
        if (!metric) throw new TimelineError('not_found');
        move(repo.listMetrics(tx, metric.timelineId), id, direction, (metricId, sortOrder) =>
          repo.updateMetric(tx, metricId, { sortOrder }),
        );
      });
    },

    removeMetric(id: string) {
      repo.deleteMetric(db, id);
    },
  };
}

export type TimelineService = ReturnType<typeof createTimelineService>;
