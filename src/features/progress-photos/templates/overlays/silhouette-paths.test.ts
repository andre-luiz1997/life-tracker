import { templates } from '..';
import { silhouettePaths } from './silhouette-paths';

describe('silhouette paths', () => {
  const used = templates.flatMap((t) => t.angles.flatMap((a) => (a.overlay ? [a.overlay] : [])));

  it.each([...new Set(used)])('%s has an outline inside the 100×160 box', (key) => {
    const d = silhouettePaths[key];
    expect(d).toMatch(/^M[\d. LMZ]+$/);
    const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(100);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(160);
  });

  it('gives each arm pose its own outline', () => {
    expect(silhouettePaths['body-arms']).not.toBe(silhouettePaths['body-arms-flexed']);
  });
});
