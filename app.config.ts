import type { ConfigContext, ExpoConfig } from 'expo/config';

// TODO: confirmar o identificador definitivo antes do primeiro build de loja.
const BUNDLE_ID = 'com.andreluiz.lifetracker';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Life Tracker',
  slug: 'life-tracker',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'lifetracker',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    icon: './assets/expo.icon',
    supportsTablet: false,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    // Dados sensíveis: nunca entram no backup automático do Google.
    allowBackup: false,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    ['expo-sqlite', { useSQLCipher: true }],
    'expo-secure-store',
    'expo-localization',
    'react-native-quick-crypto',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
