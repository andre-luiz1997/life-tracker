import type { MetricDefinition } from '../db/progress-photos.schema';
import { defaultPair, metricDiffs, sideBySideLayout } from './compare';

const metric = (id: string, unit = 'kg') =>
  ({ id, key: id, label: id, unit, sortOrder: 0, timelineId: 't' }) as MetricDefinition;

describe('compare', () => {
  it('defaults to first × last', () => {
    const list = ['a', 'b', 'c'].map((id) => ({ photo: { id } }));
    expect(defaultPair(list)).toEqual(['a', 'c']);
    expect(defaultPair(list.slice(0, 1))).toBeNull();
    expect(defaultPair([])).toBeNull();
  });

  it('diffs metrics present in both entries', () => {
    const before = new Map([
      ['weight', 90],
      ['waist', 100],
    ]);
    const after = new Map([
      ['weight', 85.8],
      ['hip', 99],
    ]);
    const diffs = metricDiffs(
      [metric('weight'), metric('waist', 'cm'), metric('hip', 'cm')],
      before,
      after,
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]!.metric.id).toBe('weight');
    expect(diffs[0]!.change).toBeCloseTo(-4.2);
    expect(metricDiffs([metric('weight')], undefined, after)).toEqual([]);
  });

  it('lays out two photos at the same height within the max width', () => {
    const layout = sideBySideLayout(
      { width: 1920, height: 2560 },
      { width: 1920, height: 2560 },
      { maxWidth: 1616, gap: 16, caption: 60 },
    );
    expect(layout.left.height).toBe(layout.right.height);
    expect(layout.width).toBe(1616);
    expect(layout.left.width).toBeCloseTo(800);
    expect(layout.right.x).toBeCloseTo(816);
    expect(layout.height).toBe(Math.round(layout.left.height + 60));
  });

  it('never upscales small photos', () => {
    const layout = sideBySideLayout({ width: 300, height: 400 }, { width: 600, height: 400 });
    expect(layout.left.height).toBe(400);
    expect(layout.right.width).toBe(600);
  });
});
