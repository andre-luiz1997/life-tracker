import { appSettings, getDatabase, readSetting, useDbQuery, writeSetting } from '@/core/db';

const KEY = 'appearance.colorScheme';

/** `system` follows the device; `light`/`dark` force the scheme regardless of it. */
export const COLOR_SCHEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ColorSchemePreference = (typeof COLOR_SCHEME_PREFERENCES)[number];
export const DEFAULT_COLOR_SCHEME_PREFERENCE: ColorSchemePreference = 'system';

export function readColorSchemePreference(): ColorSchemePreference {
  const value = readSetting<string>(getDatabase(), KEY, DEFAULT_COLOR_SCHEME_PREFERENCE);
  return (COLOR_SCHEME_PREFERENCES as readonly string[]).includes(value)
    ? (value as ColorSchemePreference)
    : DEFAULT_COLOR_SCHEME_PREFERENCE;
}

export function setColorSchemePreference(preference: ColorSchemePreference) {
  writeSetting(getDatabase(), KEY, preference);
}

/** Light/dark preference (Settings → Appearance). */
export function useColorSchemePreference(): ColorSchemePreference {
  return (
    useDbQuery(readColorSchemePreference, [appSettings]).data ?? DEFAULT_COLOR_SCHEME_PREFERENCE
  );
}
