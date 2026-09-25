import { hashSecret, verifySecret } from '@/core/crypto';
import type { AppDatabase } from '@/core/db';
import { createTestDatabase } from '@/test/db';

import { createSecurityService, InvalidPinError, type SecurityService } from './security.service';

describe('security.service', () => {
  let db: AppDatabase;
  let service: SecurityService;
  let stored: string | null;
  let clock: number;

  beforeEach(async () => {
    db = await createTestDatabase();
    stored = null;
    clock = 1_000_000;
    service = createSecurityService({
      db,
      secrets: {
        get: async () => stored,
        set: async (v) => {
          stored = v;
        },
        remove: async () => {
          stored = null;
        },
      },
      // Real PBKDF2 with few iterations to keep the test fast.
      hash: (pin) => hashSecret(pin, 1000),
      verify: verifySecret,
      now: () => clock,
    });
  });

  it('stores only a hash of the PIN', async () => {
    await service.setPin('2468');
    expect(await service.isPinEnabled()).toBe(true);
    expect(stored).toMatch(/^pbkdf2-sha256\$/);
    expect(stored).not.toContain('2468');
    await expect(service.setPin('12')).rejects.toThrow(InvalidPinError);
  });

  it('verifies the PIN', async () => {
    await service.setPin('2468');
    expect(await service.verifyPin('2468')).toEqual({ ok: true });
    expect(await service.verifyPin('1111')).toEqual({ ok: false, lockedUntil: null });
  });

  it('locks out progressively after 5 wrong attempts and resets on success', async () => {
    await service.setPin('2468');
    for (let i = 0; i < 4; i++) expect((await service.verifyPin('0000')).ok).toBe(false);
    expect(service.remainingLockoutMs()).toBe(0);

    const fifth = await service.verifyPin('0000');
    expect(fifth).toEqual({ ok: false, lockedUntil: clock + 30_000 });
    // Even the right PIN is refused while locked out.
    expect(await service.verifyPin('2468')).toEqual({ ok: false, lockedUntil: clock + 30_000 });

    clock += 30_000;
    expect(await service.verifyPin('0000')).toEqual({ ok: false, lockedUntil: clock + 60_000 });
    clock += 60_000;
    expect(await service.verifyPin('2468')).toEqual({ ok: true });
    expect(await service.verifyPin('0000')).toEqual({ ok: false, lockedUntil: null });
  });

  it('merges preferences over the defaults and disables biometrics with the PIN', async () => {
    expect(service.getPreferences()).toEqual({
      biometrics: false,
      autoLock: 'immediate',
      blockScreenshots: true,
    });
    await service.setPin('2468');
    service.setPreferences({ biometrics: true, autoLock: '5m' });
    expect(service.getPreferences()).toMatchObject({
      biometrics: true,
      autoLock: '5m',
      blockScreenshots: true,
    });

    await service.removePin();
    expect(await service.isPinEnabled()).toBe(false);
    expect(service.getPreferences().biometrics).toBe(false);
  });
});
