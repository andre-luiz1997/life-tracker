import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const scheme = useAppColorScheme();

  return (
    <NativeTabs
      backgroundColor={colorOf(scheme, 'surface')}
      indicatorColor={colorOf(scheme, 'surface-muted')}
      labelStyle={{ selected: { color: colorOf(scheme, 'foreground') } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'photo.stack', selected: 'photo.stack.fill' }}
          md="photo_library"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
