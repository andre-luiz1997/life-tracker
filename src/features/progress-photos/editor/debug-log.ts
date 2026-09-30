/**
 * TEMPORARY diagnostics for the photo editor. Not guarded by __DEV__ so the lines also show in
 * `adb logcat | grep KRONOS:editor` on preview builds. Never logs pixels, bytes or file contents.
 */
const TAG = '[KRONOS:editor]';

export function editorLog(event: string, data?: Record<string, unknown>) {
  console.log(TAG, event, data ? JSON.stringify(data) : '');
}

export function editorError(event: string, error: unknown, data?: Record<string, unknown>) {
  const detail =
    error instanceof Error ? { message: error.message, stack: error.stack } : { error };
  console.warn(TAG, `ERROR ${event}`, JSON.stringify({ ...data, ...detail }));
}

/** Runs `fn`, logging its duration and any throw (rethrown). */
export function timed<T>(event: string, fn: () => T, data?: Record<string, unknown>): T {
  const start = Date.now();
  try {
    const result = fn();
    editorLog(event, { ...data, ms: Date.now() - start, result: describe(result) });
    return result;
  } catch (error) {
    editorError(event, error, data);
    throw error;
  }
}

function describe(value: unknown) {
  if (value === null || value === undefined) return String(value);
  if (value instanceof Uint8Array) return `bytes(${value.length})`;
  const maybeImage = value as { width?: () => number; height?: () => number };
  if (typeof maybeImage.width === 'function' && typeof maybeImage.height === 'function') {
    return `image(${maybeImage.width()}x${maybeImage.height()})`;
  }
  return typeof value;
}
