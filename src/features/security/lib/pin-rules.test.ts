import { isValidPin, lockoutDelayMs, shouldLockOnResume } from './pin-rules';

describe('pin rules', () => {
  it('accepts 4 to 6 digits only', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin(' 1234')).toBe(false);
  });

  it('delays progressively after the free attempts', () => {
    expect([0, 1, 4].map(lockoutDelayMs)).toEqual([0, 0, 0]);
    expect(lockoutDelayMs(5)).toBe(30_000);
    expect(lockoutDelayMs(6)).toBe(60_000);
    expect(lockoutDelayMs(7)).toBe(300_000);
    expect(lockoutDelayMs(8)).toBe(900_000);
    expect(lockoutDelayMs(9)).toBe(3_600_000);
    expect(lockoutDelayMs(50)).toBe(3_600_000);
  });

  it('locks on resume according to the auto-lock setting', () => {
    expect(shouldLockOnResume(null, 1000, 'immediate')).toBe(false);
    expect(shouldLockOnResume(1000, 1000, 'immediate')).toBe(true);
    expect(shouldLockOnResume(0, 59_000, '1m')).toBe(false);
    expect(shouldLockOnResume(0, 60_000, '1m')).toBe(true);
    expect(shouldLockOnResume(0, 299_000, '5m')).toBe(false);
  });
});
