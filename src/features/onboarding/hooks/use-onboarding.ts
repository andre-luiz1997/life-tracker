import { appSettings, getDatabase, readSetting, useDbQuery, writeSetting } from '@/core/db';

const KEY = 'onboarding.completedAt';

export function useOnboardingDone() {
  return useDbQuery(
    () => readSetting<string | null>(getDatabase(), KEY, null) !== null,
    [appSettings],
  );
}

export function completeOnboarding() {
  writeSetting(getDatabase(), KEY, new Date().toISOString());
}
