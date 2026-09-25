import { authenticateAsync, hasHardwareAsync, isEnrolledAsync } from 'expo-local-authentication';

import { withExternalActivity } from '@/core/lifecycle';

export async function isBiometricsAvailable(): Promise<boolean> {
  try {
    return (await hasHardwareAsync()) && (await isEnrolledAsync());
  } catch {
    return false;
  }
}

/** Biometric prompt only (no device passcode fallback: the app PIN is the fallback). */
export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  try {
    const result = await withExternalActivity(() =>
      authenticateAsync({ promptMessage, disableDeviceFallback: true }),
    );
    return result.success;
  } catch {
    return false;
  }
}
