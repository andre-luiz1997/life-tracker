import {
  allowScreenCaptureAsync,
  enableAppSwitcherProtectionAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import { type PropsWithChildren, useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Platform, View } from 'react-native';

import { isInExternalActivity } from '@/core/lifecycle';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Icon } from '@/shared/ui';

import { useSecurityPreferences, useSecurityService } from '../hooks/use-security';
import { useLockStore } from '../lib/lock.store';
import { shouldLockOnResume } from '../lib/pin-rules';
import { LockScreen } from './lock-screen';

const SCREEN_CAPTURE_KEY = 'security';

type AppLockProps = PropsWithChildren<{
  /** Runs when the app really goes to the background (e.g. wipe decrypted caches). */
  onBackground?: () => void;
}>;

/**
 * Wraps the app: lock screen overlay (keeps the navigation state underneath), auto-lock on
 * resume, privacy cover in the app switcher and optional screenshot blocking.
 */
export function AppLock({ children, onBackground }: AppLockProps) {
  const scheme = useAppColorScheme();
  const service = useSecurityService();
  const prefs = useSecurityPreferences();
  const status = useLockStore((s) => s.status);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    service.isPinEnabled().then((enabled) => useLockStore.getState().init(enabled));
  }, [service]);

  // iOS: native blur in the app switcher (Android relies on FLAG_SECURE below).
  useEffect(() => {
    if (Platform.OS === 'ios') enableAppSwitcherProtectionAsync(1).catch(() => {});
  }, []);

  const blockScreenshots = prefs.data?.blockScreenshots ?? true;
  useEffect(() => {
    (blockScreenshots
      ? preventScreenCaptureAsync(SCREEN_CAPTURE_KEY)
      : allowScreenCaptureAsync(SCREEN_CAPTURE_KEY)
    ).catch(() => {});
  }, [blockScreenshots]);

  const onAppStateChange = useEffectEvent((next: AppStateStatus) => {
    setAppState(next);
    if (isInExternalActivity()) return;

    if (next === 'background') {
      backgroundedAt.current = Date.now();
      onBackground?.();
      if (service.getPreferences().autoLock === 'immediate') useLockStore.getState().lock();
    } else if (next === 'active') {
      if (
        shouldLockOnResume(backgroundedAt.current, Date.now(), service.getPreferences().autoLock)
      ) {
        useLockStore.getState().lock();
      }
      backgroundedAt.current = null;
    }
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => onAppStateChange(s));
    return () => sub.remove();
  }, []);

  const covered = appState !== 'active' && !isInExternalActivity();

  return (
    <View className="flex-1">
      {children}
      {status === 'locked' ? <LockScreen service={service} /> : null}
      {status === 'checking' || covered ? (
        <View
          className="absolute inset-0 items-center justify-center bg-background"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Icon name="lock" size={40} color={colorOf(scheme, 'muted')} />
        </View>
      ) : null}
    </View>
  );
}
