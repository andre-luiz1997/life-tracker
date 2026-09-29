import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { cubicLength, LOGO_VIEWBOX, logoDots, logoLines } from './kronos-logo';

const svg = readFileSync(join(__dirname, '../../../../assets/brand/kronos-logo.svg'), 'utf8');

describe('kronos logo', () => {
  it('matches the brand SVG that generates the icons and the native splash', () => {
    const paths = [...svg.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths).toEqual(logoLines.map((l) => l.d));
    const circles = [...svg.matchAll(/<circle cx="(\d+)" cy="(\d+)" r="(\d+)"/g)].map((m) => ({
      cx: Number(m[1]),
      cy: Number(m[2]),
      r: Number(m[3]),
    }));
    expect(circles).toEqual(logoDots);
    const { x, y, width, height } = LOGO_VIEWBOX;
    expect(svg).toContain(`viewBox="${x} ${y} ${width} ${height}"`);
  });

  it('measures lines and curves', () => {
    expect(cubicLength([0, 0], [10, 0], [20, 0], [30, 0])).toBeCloseTo(30);
    const [rightCurve, , , innerBar] = logoLines;
    expect(innerBar?.length).toBe(624);
    // Longer than the straight 624 between its ends, but not wildly.
    expect(rightCurve?.length).toBeGreaterThan(624);
    expect(rightCurve?.length).toBeLessThan(900);
  });
});
