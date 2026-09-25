export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`).test(pin);
}

/** Free attempts before delays start. */
export const FREE_ATTEMPTS = 5;
const DELAYS_MS = [30_000, 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];

/** Delay imposed after `failures` consecutive wrong PINs (progressive, capped at 1 h). */
export function lockoutDelayMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return DELAYS_MS[Math.min(failures - FREE_ATTEMPTS, DELAYS_MS.length - 1)]!;
}

export type AutoLock = 'immediate' | '1m' | '5m';
export const AUTO_LOCK_MS: Record<AutoLock, number> = {
  immediate: 0,
  '1m': 60_000,
  '5m': 5 * 60_000,
};

/** Whether returning from the background should lock, given how long the app was away. */
export function shouldLockOnResume(backgroundedAt: number | null, now: number, autoLock: AutoLock) {
  return backgroundedAt !== null && now - backgroundedAt >= AUTO_LOCK_MS[autoLock];
}
