/**
 * Level math from the gravity vector (accelerometer including gravity), in device coordinates:
 * x → right edge, y → top edge, z → out of the screen. Units don't matter (normalized).
 *
 * Two target poses:
 * - upright: phone vertical in portrait (body, face, nape shots).
 * - flat: phone horizontal, screen up, back camera facing down (crown/top of head shots).
 *
 * Deviation values are unsigned, so they don't depend on per-platform sign conventions.
 * Offsets (used to draw the bubble) are signed; their direction must be validated on devices.
 */
export type LevelTarget = 'upright' | 'flat';

export type Gravity = { x: number; y: number; z: number };

export type LevelReading = {
  /** Total deviation from the target pose, in degrees (0 = perfectly level). */
  deviation: number;
  /** Signed offsets in degrees, for the bubble indicator: [-90, 90]. */
  offsetX: number;
  offsetY: number;
};

const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function readLevel(g: Gravity, target: LevelTarget): LevelReading | null {
  const norm = Math.hypot(g.x, g.y, g.z);
  if (!Number.isFinite(norm) || norm < 1e-6) return null;
  const x = g.x / norm;
  const y = g.y / norm;
  const z = g.z / norm;

  if (target === 'flat') {
    // Gravity should be entirely along z.
    return {
      deviation: toDeg(Math.acos(Math.min(1, Math.abs(z)))),
      offsetX: toDeg(Math.asin(x)),
      offsetY: toDeg(Math.asin(y)),
    };
  }

  // Upright: gravity entirely along -y (top edge up). Roll = rotation around z,
  // pitch = leaning towards/away from the subject.
  const roll = toDeg(Math.atan2(x, Math.abs(y)));
  const pitch = toDeg(Math.asin(Math.max(-1, Math.min(1, z))));
  return {
    deviation: toDeg(Math.acos(Math.min(1, Math.abs(y)))),
    offsetX: roll,
    offsetY: pitch,
  };
}
