import Constants from 'expo-constants';
import type { PropsWithChildren } from 'react';
import { ScrollView } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Screen, Text } from '@/shared/ui';

/** Settings shell; each feature contributes its own section as children (composed in app/). */
export function SettingsScreen({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  return (
    <Screen className="px-0">
      <ScrollView contentContainerClassName="gap-8 px-4 pb-16">
        <Text variant="title" className="mt-4" accessibilityRole="header">
          {t('settings.title')}
        </Text>
        {children}
        <Text variant="caption" className="text-center">
          {t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}
        </Text>
      </ScrollView>
    </Screen>
  );
}
