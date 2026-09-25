import { useMemo } from 'react';

import { getDatabase, useDbQuery } from '@/core/db';
import { i18n } from '@/core/i18n';
import { secureFileStore } from '@/core/storage';

import {
  entries,
  metricDefinitions,
  timelineAngles,
  timelines,
} from '../db/progress-photos.schema';
import * as repo from '../repositories/timelines.repository';
import { createTimelineService } from '../services/timeline.service';

export function useTimelineService() {
  return useMemo(
    () =>
      createTimelineService({
        db: getDatabase(),
        files: secureFileStore,
        translate: (key) => i18n.t(key as never),
      }),
    [],
  );
}

export function useTimelineSummaries({ archived }: { archived: boolean }) {
  return useDbQuery(
    () => repo.listTimelineSummaries(getDatabase(), { archived }),
    [timelines, entries],
    [archived],
  );
}

/** Timeline with its angles and metric definitions, refreshed on any change. */
export function useTimelineDetails(id: string) {
  return useDbQuery(
    () => {
      const db = getDatabase();
      const timeline = repo.getTimeline(db, id);
      if (!timeline) return null;
      return { timeline, angles: repo.listAngles(db, id), metrics: repo.listMetrics(db, id) };
    },
    [timelines, timelineAngles, metricDefinitions],
    [id],
  );
}
