import { useTranslation } from '@/core/i18n';
import { EmptyState, Screen, Text } from '@/shared/ui';

export function HomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Text variant="title" className="mt-4">
        {t('home.title')}
      </Text>
      <EmptyState title={t('home.empty.title')} description={t('home.empty.description')} />
    </Screen>
  );
}
