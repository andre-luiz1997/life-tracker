import { router } from 'expo-router';
import { View } from 'react-native';

import { i18n, useTranslation } from '@/core/i18n';
import { Button, Card, Section, Text } from '@/shared/ui';

import { useLastBackupDate } from '../hooks/use-backup';

export function BackupSettings() {
  const { t } = useTranslation('backup');
  const last = useLastBackupDate();

  return (
    <Section title={t('section')} hint={t('hint')}>
      <Card className="gap-3">
        <Text variant="caption">
          {last.data
            ? t('lastBackup', {
                date: last.data.toLocaleDateString(i18n.language, { dateStyle: 'long' }),
              })
            : t('never')}
        </Text>
        <View className="flex-row gap-2">
          <Button
            label={t('export')}
            onPress={() => router.push('/backup/export')}
            className="flex-1"
          />
          <Button
            variant="secondary"
            label={t('restore')}
            onPress={() => router.push('/backup/restore')}
            className="flex-1"
          />
        </View>
      </Card>
    </Section>
  );
}
