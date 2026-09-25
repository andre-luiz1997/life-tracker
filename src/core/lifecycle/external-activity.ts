/**
 * System UI launched by the app itself (photo picker, share sheet, permission and biometric
 * prompts) sends the app to the background. That must not trigger auto-lock or cache wiping,
 * so callers wrap it in `withExternalActivity`.
 */
let active = 0;
let lastEndedAt = 0;

/** Grace period: AppState "active" may arrive slightly after the promise resolves. */
const GRACE_MS = 1500;

export async function withExternalActivity<T>(fn: () => Promise<T>): Promise<T> {
  active++;
  try {
    return await fn();
  } finally {
    active--;
    lastEndedAt = Date.now();
  }
}

export function isInExternalActivity(now = Date.now()): boolean {
  return active > 0 || now - lastEndedAt < GRACE_MS;
}
