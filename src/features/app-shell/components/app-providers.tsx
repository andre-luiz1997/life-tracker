import {
  Palanquin_400Regular,
  Palanquin_500Medium,
  Palanquin_600SemiBold,
  Palanquin_700Bold,
} from '@expo-google-fonts/palanquin';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type PropsWithChildren, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DatabaseProvider } from '@/core/db';
import { colorOf, ThemeProvider, useAppColorScheme } from '@/shared/theme';

import { IntroSplash } from './intro-splash';
import { StartupError } from './startup-error';

// Hidden by IntroSplash, which takes over with the same look.
SplashScreen.preventAutoHideAsync();

function NavigationTheme({ children }: PropsWithChildren) {
  const scheme = useAppColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colorOf(scheme, 'primary'),
      background: colorOf(scheme, 'background'),
      card: colorOf(scheme, 'surface'),
      text: colorOf(scheme, 'foreground'),
      border: colorOf(scheme, 'border'),
    },
  };
  return (
    <NavigationThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </NavigationThemeProvider>
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  const [introDone, setIntroDone] = useState(false);
  // Keep the splash screen up until the brand font is ready (avoids a flash of system font).
  const [fontsLoaded, fontError] = useFonts({
    Palanquin_400Regular,
    Palanquin_500Medium,
    Palanquin_600SemiBold,
    Palanquin_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationTheme>
          <DatabaseProvider fallback={null} renderError={(error) => <StartupError error={error} />}>
            {children}
          </DatabaseProvider>
        </NavigationTheme>
      </ThemeProvider>
      {introDone ? null : <IntroSplash onDone={() => setIntroDone(true)} />}
    </GestureHandlerRootView>
  );
}
