import { daysBetween } from './dates';

describe('daysBetween', () => {
  it('counts calendar days, ignoring the time', () => {
    expect(daysBetween(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1))).toBe(1);
    expect(daysBetween(new Date(2026, 0, 1, 8), new Date(2026, 0, 1, 22))).toBe(0);
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 1, 1))).toBe(31);
  });

  it('handles DST transitions', () => {
    // Brazil no longer has DST, but other locales do.
    expect(daysBetween(new Date(2026, 2, 1), new Date(2026, 3, 1))).toBe(31);
  });
});
