import { useTranslation } from '@/core/i18n';
import { EmptyState, Screen } from '@/shared/ui';

export function StartupError({ error }: { error: Error }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState title={t('errors.dbInit')} description={__DEV__ ? error.message : undefined} />
    </Screen>
  );
}
