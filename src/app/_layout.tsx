import '@/shared/theme/global.css';

import { Stack } from 'expo-router';

import { useTranslation } from '@/core/i18n';
import { AppProviders } from '@/features/app-shell';
import {
  clearDecryptedPhotos,
  useReminders,
  useStartupMaintenance,
} from '@/features/progress-photos';
import { AppLock } from '@/features/security';
import { colorOf, fonts, useAppColorScheme } from '@/shared/theme';

export default function RootLayout() {
  return (
    <AppProviders>
      <AppLock onBackground={clearDecryptedPhotos}>
        <RootStack />
      </AppLock>
    </AppProviders>
  );
}

function RootStack() {
  const { t } = useTranslation();
  const scheme = useAppColorScheme();
  useStartupMaintenance();
  useReminders();
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerLargeTitleStyle: { fontFamily: fonts.bold },
        headerStyle: { backgroundColor: colorOf(scheme, 'background') },
        contentStyle: { backgroundColor: colorOf(scheme, 'background') },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: t('tabs.home') }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="timeline/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="security/pin" options={{ presentation: 'modal' }} />
      <Stack.Screen name="backup/export" options={{ presentation: 'modal' }} />
      <Stack.Screen name="backup/restore" options={{ presentation: 'modal' }} />
      <Stack.Screen name="timeline/[timelineId]/index" />
      <Stack.Screen name="timeline/[timelineId]/settings" />
      <Stack.Screen name="timeline/[timelineId]/session" />
      <Stack.Screen name="timeline/[timelineId]/entry/[entryId]" />
      <Stack.Screen name="timeline/[timelineId]/metrics" />
      <Stack.Screen name="timeline/[timelineId]/compare" />
      <Stack.Screen
        name="timeline/[timelineId]/viewer"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="timeline/[timelineId]/capture"
        options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="timeline/[timelineId]/edit"
        options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="timeline/[timelineId]/review"
        options={{ headerShown: false, animation: 'fade' }}
      />
    </Stack>
  );
}
