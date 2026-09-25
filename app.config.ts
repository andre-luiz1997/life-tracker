import type { ConfigContext, ExpoConfig } from 'expo/config';

// TODO: confirmar o identificador definitivo antes do primeiro build de loja.
const BUNDLE_ID = 'com.andreluiz.lifetracker';

// Both expo-image-picker and expo-media-library write NSPhotoLibraryUsageDescription.
const PHOTOS_PERMISSION =
  'O Life Tracker acessa sua galeria para importar fotos e, se você pedir, apagar os originais importados.';

const CAMERA_PERMISSION =
  'O Life Tracker usa a câmera para tirar as fotos de progresso. As fotos ficam só no app, criptografadas.';

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
    [
      'expo-secure-store',
      { faceIDPermission: 'O Life Tracker usa o Face ID para desbloquear o app, se você ativar.' },
    ],
    'expo-localization',
    'react-native-quick-crypto',
    [
      'expo-camera',
      {
        cameraPermission: CAMERA_PERMISSION,
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: PHOTOS_PERMISSION,
        // Must not be `false`: that adds CAMERA to blockedPermissions, breaking expo-camera.
        cameraPermission: CAMERA_PERMISSION,
        microphonePermission: false,
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: PHOTOS_PERMISSION,
        savePhotosPermission: false,
        // Only deletes the originals the user imported; no broad READ_MEDIA_* (Play policy).
        granularPermissions: [],
      },
    ],
    // DeviceMotion needs no permission; this only disables the pedometer prompt.
    ['expo-sensors', { motionPermission: false }],
    [
      'expo-audio',
      { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
