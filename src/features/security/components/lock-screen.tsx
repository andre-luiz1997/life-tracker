import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDatabaseRestart } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { eraseAllData } from '@/core/maintenance';
import { Icon, PinPad, Text } from '@/shared/ui';
import { colorOf, useAppColorScheme } from '@/shared/theme';

import { authenticateWithBiometrics, isBiometricsAvailable } from '../lib/biometrics';
import { useLockStore } from '../lib/lock.store';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../lib/pin-rules';
import type { SecurityService } from '../services/security.service';

export function LockScreen({ service }: { service: SecurityService }) {
  const { t } = useTranslation('security');
  const scheme = useAppColorScheme();
  const insets = useSafeAreaInsets();
  const unlock = useLockStore((s) => s.unlock);
  const restart = useDatabaseRestart();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(() => Date.now() + service.remainingLockoutMs());
  const [now, setNow] = useState(Date.now);
  const [biometrics, setBiometrics] = useState(false);

  const remaining = Math.max(0, lockedUntil - now);

  // Tick while locked out so the countdown and the keypad re-enable on time.
  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const tryBiometrics = useCallback(async () => {
    if (await authenticateWithBiometrics(t('lock.biometricPrompt'))) {
      service.recordSuccessfulUnlock();
      unlock();
    }
  }, [service, t, unlock]);

  useEffect(() => {
    let active = true;
    if (!service.getPreferences().biometrics) return;
    isBiometricsAvailable().then((available) => {
      if (!active || !available) return;
      setBiometrics(true);
      if (service.remainingLockoutMs() === 0) void tryBiometrics();
    });
    return () => {
      active = false;
    };
  }, [service, tryBiometrics]);

  const submit = async () => {
    const result = await service.verifyPin(pin);
    setPin('');
    if (result.ok) return unlock();
    setError(t('lock.wrong'));
    if (result.lockedUntil) {
      setLockedUntil(result.lockedUntil);
      setNow(Date.now());
    }
  };

  const forgot = () =>
    Alert.alert(t('lock.forgotTitle'), t('lock.forgotMessage'), [
      { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
      {
        text: t('lock.eraseAndReset'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.eraseConfirmFinal'), undefined, [
            { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
            {
              text: t('settings.erase'),
              style: 'destructive',
              onPress: async () => {
                await restart(eraseAllData);
                useLockStore.getState().init(false);
              },
            },
          ]),
      },
    ]);

  const seconds = Math.ceil(remaining / 1000);
  const time =
    seconds >= 60
      ? t('duration.minutes', { count: Math.ceil(seconds / 60) })
      : t('duration.seconds', { count: seconds });

  return (
    <View
      className="absolute inset-0 items-center justify-center gap-8 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      accessibilityViewIsModal>
      <View className="items-center gap-2">
        <Icon name="lock" size={36} color={colorOf(scheme, 'primary')} />
        <Text variant="title" accessibilityRole="header">
          {t('lock.title')}
        </Text>
        <Text
          variant="caption"
          accessibilityLiveRegion="polite"
          className={error ? 'text-danger' : undefined}>
          {remaining > 0 ? t('lock.lockedOut', { time }) : (error ?? t('lock.subtitle'))}
        </Text>
      </View>

      <PinPad
        value={pin}
        onChange={(v) => {
          setError(null);
          setPin(v);
        }}
        onSubmit={submit}
        minLength={PIN_MIN_LENGTH}
        maxLength={PIN_MAX_LENGTH}
        disabled={remaining > 0}
        labels={{
          delete: t('pinPad.delete'),
          submit: t('pinPad.submit'),
          digits: (n) => t('pinPad.digits', { count: n }),
        }}
        leftAction={
          biometrics && remaining === 0
            ? { icon: 'biometrics', label: t('lock.useBiometrics'), onPress: tryBiometrics }
            : undefined
        }
      />

      <Pressable accessibilityRole="button" onPress={forgot} className="py-2">
        <Text variant="caption" className="text-primary">
          {t('lock.forgot')}
        </Text>
      </Pressable>
    </View>
  );
}
