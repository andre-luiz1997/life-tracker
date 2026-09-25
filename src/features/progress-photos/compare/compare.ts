import type { MetricDefinition } from '../db/progress-photos.schema';

export type CompareMode = 'side' | 'slider' | 'overlay';

/** Default comparison: first × last photo of the angle (chronological list). */
export function defaultPair<T extends { photo: { id: string } }>(
  list: T[],
): [string, string] | null {
  const first = list[0];
  const last = list.at(-1);
  if (!first || !last || first === last) return null;
  return [first.photo.id, last.photo.id];
}

export type MetricDiff = {
  metric: MetricDefinition;
  before: number;
  after: number;
  change: number;
};

/** Metrics present in both entries, with after − before. */
export function metricDiffs(
  metrics: MetricDefinition[],
  before: Map<string, number> | undefined,
  after: Map<string, number> | undefined,
): MetricDiff[] {
  return metrics.flatMap((metric) => {
    const a = before?.get(metric.id);
    const b = after?.get(metric.id);
    return a === undefined || b === undefined
      ? []
      : [{ metric, before: a, after: b, change: b - a }];
  });
}

type Size = { width: number; height: number };
type Rect = { x: number; y: number; width: number; height: number };

/**
 * Layout of the exported side-by-side image: both photos scaled to the same height, a gap
 * between them and a caption band below each. Width is capped to `maxWidth`.
 */
export function sideBySideLayout(
  a: Size,
  b: Size,
  {
    maxWidth = 2400,
    gap = 16,
    caption = 72,
  }: { maxWidth?: number; gap?: number; caption?: number } = {},
) {
  // Height that makes the two images, side by side, exactly fill maxWidth (minus the gap).
  const height = Math.min(
    Math.max(a.height, b.height),
    (maxWidth - gap) / (a.width / a.height + b.width / b.height),
  );
  const wa = (a.width / a.height) * height;
  const wb = (b.width / b.height) * height;
  const left: Rect = { x: 0, y: 0, width: wa, height };
  const right: Rect = { x: wa + gap, y: 0, width: wb, height };
  return {
    width: Math.round(wa + gap + wb),
    height: Math.round(height + caption),
    left,
    right,
    captionTop: height,
  };
}
