import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Chip, Section } from '@/shared/ui';

import {
  COLOR_SCHEME_PREFERENCES,
  setColorSchemePreference,
  useColorSchemePreference,
} from '../hooks/use-color-scheme-preference';

/** Settings section: light/dark mode, or follow the device. */
export function AppearanceSettings() {
  const { t } = useTranslation();
  const current = useColorSchemePreference();

  return (
    <Section title={t('settings.appearance.title')} hint={t('settings.appearance.hint')}>
      <View accessibilityRole="radiogroup" className="flex-row gap-2">
        {COLOR_SCHEME_PREFERENCES.map((preference) => (
          <Chip
            key={preference}
            role="radio"
            label={t(`settings.appearance.${preference}`)}
            selected={preference === current}
            onPress={() => setColorSchemePreference(preference)}
            className="flex-1"
          />
        ))}
      </View>
    </Section>
  );
}
