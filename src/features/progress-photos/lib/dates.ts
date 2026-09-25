const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar days between two dates (local time), ignoring the time of day. */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}
