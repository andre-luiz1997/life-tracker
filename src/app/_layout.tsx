import '@/shared/theme/global.css';

import { Stack } from 'expo-router';

import { useTranslation } from '@/core/i18n';
import { AppProviders } from '@/features/app-shell';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootStack />
    </AppProviders>
  );
}

function RootStack() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('tabs.home') }} />
      <Stack.Screen name="timeline/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="timeline/[timelineId]/index" />
      <Stack.Screen name="timeline/[timelineId]/settings" />
    </Stack>
  );
}
