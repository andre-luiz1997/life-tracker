/**
 * KRONOS logo as stroke geometry (source of truth: `assets/brand/kronos-logo.svg`, which also
 * feeds the icons and the native splash via `scripts/brand-assets.sh`).
 */

type Point = readonly [number, number];

export const LOGO_COLOR = '#FDA887';
export const LOGO_STROKE_WIDTH = 27;
/** Tight bounds of the drawing (dots included), in SVG units. */
export const LOGO_VIEWBOX = { x: 203, y: 177, width: 617, height: 672 } as const;

/** Background of the native splash (same as the Home screen, light theme). */
export const SPLASH_BACKGROUND = '#FAFAF8';
/**
 * On-screen height of the logo in the native splash: `imageWidth` (200) × the share of
 * `splash-icon.png` the logo fills (600/1024). Android 12+ and iOS both show it at this size.
 */
export const SPLASH_LOGO_HEIGHT = (200 * 600) / 1024;

export type LogoLine = { d: string; length: number };
export type LogoDot = { cx: number; cy: number; r: number };

const line = (from: Point, to: Point): LogoLine => ({
  d: `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`,
  length: Math.hypot(to[0] - from[0], to[1] - from[1]),
});

/** Arc length of a cubic Bézier, by sampling (plenty for a dash animation). */
export function cubicLength(p0: Point, p1: Point, p2: Point, p3: Point, steps = 64) {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    const next: Point = [
      a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    ];
    length += Math.hypot(next[0] - prev[0], next[1] - prev[1]);
    prev = next;
  }
  return length;
}

/** Two cubic segments meeting at the waist of the hourglass. */
const curve = (
  start: Point,
  c1: Point,
  c2: Point,
  mid: Point,
  c3: Point,
  c4: Point,
  end: Point,
) => ({
  d: `M${start.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${mid.join(' ')} C${c3.join(' ')} ${c4.join(' ')} ${end.join(' ')}`,
  length: cubicLength(start, c1, c2, mid) + cubicLength(mid, c3, c4, end),
});

/** Lines in the order they come apart in the intro animation. */
export const logoLines: LogoLine[] = [
  curve([797, 200], [791, 351], [720, 441], [612, 512], [720, 583], [791, 673], [797, 824]),
  curve([704, 200], [709, 382], [546, 439], [527, 512], [546, 585], [709, 642], [704, 824]),
  curve([320, 200], [314, 386], [480, 440], [496, 512], [480, 584], [314, 638], [320, 824]),
  line([320, 200], [320, 824]),
  line([226, 200], [797, 200]),
  line([226, 824], [797, 824]),
  line([228, 200], [228, 824]),
];

export const logoDots: LogoDot[] = [
  { cx: 797, cy: 200, r: 23 },
  { cx: 797, cy: 826, r: 23 },
  { cx: 226, cy: 826, r: 23 },
  { cx: 226, cy: 200, r: 23 },
];
