import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { useDatabaseRestart } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { eraseAllData } from '@/core/maintenance';
import { Button, Card, Chip, Section, Text, Toggle } from '@/shared/ui';

import { useSecurityPreferences, useSecurityService } from '../hooks/use-security';
import { authenticateWithBiometrics, isBiometricsAvailable } from '../lib/biometrics';
import { useLockStore } from '../lib/lock.store';
import { type AutoLock } from '../lib/pin-rules';
import type { PinSetupMode } from '../screens/pin-setup-screen';

const AUTO_LOCK_OPTIONS: AutoLock[] = ['immediate', '1m', '5m'];

export function SecuritySettings() {
  const { t } = useTranslation('security');
  const service = useSecurityService();
  const prefs = useSecurityPreferences();
  const pinEnabled = useLockStore((s) => s.pinEnabled);
  const restart = useDatabaseRestart();
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    isBiometricsAvailable().then(setBiometricsAvailable);
  }, []);

  if (!prefs.data) return null;
  const p = prefs.data;

  const openPin = (mode: PinSetupMode) =>
    router.push({ pathname: '/security/pin', params: { mode } });

  const toggleBiometrics = async (value: boolean) => {
    // Confirm the user can actually pass the biometric check before relying on it.
    if (value && !(await authenticateWithBiometrics(t('lock.biometricPrompt')))) return;
    service.setPreferences({ biometrics: value });
  };

  const confirmErase = () =>
    Alert.alert(t('settings.eraseConfirmTitle'), t('settings.eraseConfirmMessage'), [
      { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
      {
        text: t('settings.erase'),
        style: 'destructive',
        onPress: () =>
          Alert.alert(t('settings.eraseConfirmFinal'), undefined, [
            { text: t('actions.cancel', { ns: 'common' }), style: 'cancel' },
            {
              text: t('settings.erase'),
              style: 'destructive',
              onPress: async () => {
                router.dismissAll();
                await restart(eraseAllData);
              },
            },
          ]),
      },
    ]);

  return (
    <View className="gap-8">
      <Section title={t('settings.title')}>
        <Card className="gap-4">
          <Row
            label={t('settings.pin')}
            value={pinEnabled ? t('settings.pinOn') : t('settings.pinOff')}
          />
          {pinEnabled ? (
            <View className="flex-row gap-2">
              <Button
                variant="secondary"
                label={t('settings.changePin')}
                onPress={() => openPin('change')}
                className="flex-1"
              />
              <Button
                variant="secondary"
                label={t('settings.disablePin')}
                onPress={() => openPin('disable')}
                className="flex-1"
              />
            </View>
          ) : (
            <Button label={t('settings.enablePin')} onPress={() => openPin('create')} />
          )}

          {pinEnabled ? (
            <>
              <ToggleRow
                label={t('settings.biometrics')}
                hint={biometricsAvailable ? undefined : t('settings.biometricsUnavailable')}
                value={p.biometrics}
                disabled={!biometricsAvailable}
                onChange={toggleBiometrics}
              />
              <View className="gap-2">
                <Text className="font-body-medium">{t('settings.autoLock')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {AUTO_LOCK_OPTIONS.map((option) => (
                    <Chip
                      key={option}
                      role="radio"
                      selected={p.autoLock === option}
                      onPress={() => service.setPreferences({ autoLock: option })}
                      label={t(`settings.autoLockOptions.${option}`)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : null}

          <ToggleRow
            label={t('settings.blockScreenshots')}
            hint={t('settings.blockScreenshotsHint')}
            value={p.blockScreenshots}
            onChange={(value) => service.setPreferences({ blockScreenshots: value })}
          />
        </Card>
      </Section>

      <Section title={t('settings.dangerZone')}>
        <Button variant="danger" label={t('settings.eraseAll')} onPress={confirmErase} />
      </Section>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-body-medium">{label}</Text>
      <Text variant="caption">{value}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 gap-0.5">
        <Text className="font-body-medium">{label}</Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      <Toggle
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        accessibilityLabel={label}
      />
    </View>
  );
}
