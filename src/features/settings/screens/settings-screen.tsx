import Constants from 'expo-constants';

import { useTranslation } from '@/core/i18n';
import { Screen, Text } from '@/shared/ui';

export function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="title" className="mt-4">
        {t('settings.title')}
      </Text>
      <Text variant="caption" className="mt-auto pb-6 text-center">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '—' })}
      </Text>
    </Screen>
  );
}
