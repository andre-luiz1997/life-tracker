import { type AppDatabase, readSetting, writeSetting } from '@/core/db';

import { type AutoLock, isValidPin, lockoutDelayMs } from '../lib/pin-rules';

export type SecurityPreferences = {
  biometrics: boolean;
  autoLock: AutoLock;
  /** Also hides the app in Android's recents (FLAG_SECURE). On by default: sensitive photos. */
  blockScreenshots: boolean;
};

export const DEFAULT_PREFERENCES: SecurityPreferences = {
  biometrics: false,
  autoLock: 'immediate',
  blockScreenshots: true,
};

const PREFS_KEY = 'security.preferences';
const ATTEMPTS_KEY = 'security.attempts';

type Attempts = { failures: number; lockedUntil: number };

type Deps = {
  db: AppDatabase;
  secrets: {
    get: () => Promise<string | null>;
    set: (value: string) => Promise<void>;
    remove: () => Promise<void>;
  };
  hash: (pin: string) => Promise<string>;
  verify: (pin: string, record: string) => Promise<boolean>;
  now?: () => number;
};

export type VerifyResult = { ok: true } | { ok: false; lockedUntil: number | null };

export class InvalidPinError extends Error {
  override name = 'InvalidPinError';
}

export function createSecurityService({ db, secrets, hash, verify, now = Date.now }: Deps) {
  const attempts = () => readSetting<Attempts>(db, ATTEMPTS_KEY, { failures: 0, lockedUntil: 0 });
  const resetAttempts = () =>
    writeSetting<Attempts>(db, ATTEMPTS_KEY, { failures: 0, lockedUntil: 0 });

  const service = {
    async isPinEnabled(): Promise<boolean> {
      return (await secrets.get()) !== null;
    },

    /** The PIN only ever exists as a PBKDF2 hash in the secure store. */
    async setPin(pin: string): Promise<void> {
      if (!isValidPin(pin)) throw new InvalidPinError();
      await secrets.set(await hash(pin));
      resetAttempts();
    },

    async removePin(): Promise<void> {
      await secrets.remove();
      resetAttempts();
      service.setPreferences({ biometrics: false });
    },

    /** Time until another attempt is allowed (0 = now). */
    remainingLockoutMs(): number {
      return Math.max(0, attempts().lockedUntil - now());
    },

    async verifyPin(pin: string): Promise<VerifyResult> {
      const current = attempts();
      if (current.lockedUntil > now()) return { ok: false, lockedUntil: current.lockedUntil };

      const record = await secrets.get();
      if (record && (await verify(pin, record))) {
        resetAttempts();
        return { ok: true };
      }

      const failures = current.failures + 1;
      const delay = lockoutDelayMs(failures);
      const lockedUntil = delay ? now() + delay : 0;
      writeSetting<Attempts>(db, ATTEMPTS_KEY, { failures, lockedUntil });
      return { ok: false, lockedUntil: lockedUntil || null };
    },

    /** Biometric success counts as a correct PIN. */
    recordSuccessfulUnlock() {
      resetAttempts();
    },

    getPreferences(): SecurityPreferences {
      return {
        ...DEFAULT_PREFERENCES,
        ...readSetting<Partial<SecurityPreferences>>(db, PREFS_KEY, {}),
      };
    },

    setPreferences(changes: Partial<SecurityPreferences>) {
      writeSetting(db, PREFS_KEY, { ...service.getPreferences(), ...changes });
    },
  };
  return service;
}

export type SecurityService = ReturnType<typeof createSecurityService>;
