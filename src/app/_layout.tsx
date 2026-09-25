import '@/shared/theme/global.css';
import '@/core/i18n';

import { Stack } from 'expo-router';

import { AppProviders } from '@/features/app-shell';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppProviders>
  );
}
