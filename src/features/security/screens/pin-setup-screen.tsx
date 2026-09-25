import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { Card, PinPad, Screen, Text } from '@/shared/ui';

import { useSecurityService } from '../hooks/use-security';
import { useLockStore } from '../lib/lock.store';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../lib/pin-rules';

export type PinSetupMode = 'create' | 'change' | 'disable';
type Step = 'verify' | 'enter' | 'confirm';

export function PinSetupScreen({ mode }: { mode: PinSetupMode }) {
  const { t } = useTranslation('security');
  const service = useSecurityService();
  const [step, setStep] = useState<Step>(mode === 'create' ? 'enter' : 'verify');
  const [pin, setPin] = useState('');
  const [first, setFirst] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    const value = pin;
    setPin('');
    setMessage(null);

    if (step === 'verify') {
      const result = await service.verifyPin(value);
      if (!result.ok) return setMessage(t('lock.wrong'));
      if (mode === 'disable') {
        await service.removePin();
        useLockStore.getState().setPinEnabled(false);
        return router.back();
      }
      return setStep('enter');
    }

    if (step === 'enter') {
      setFirst(value);
      return setStep('confirm');
    }

    if (value !== first) {
      setFirst('');
      setStep('enter');
      return setMessage(t('setup.mismatch'));
    }
    await service.setPin(value);
    useLockStore.getState().setPinEnabled(true);
    router.back();
  };

  const title =
    step === 'verify'
      ? t('setup.verifyTitle')
      : mode === 'change'
        ? t('setup.changeTitle')
        : t('setup.title');
  const prompt =
    step === 'confirm'
      ? t('setup.confirm')
      : step === 'enter'
        ? t('setup.enter')
        : t('lock.subtitle');

  return (
    <Screen className="items-center justify-center gap-8">
      <Stack.Screen options={{ title, presentation: 'modal' }} />
      <View className="items-center gap-2">
        <Text variant="subtitle">{prompt}</Text>
        {message ? (
          <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
      </View>

      <PinPad
        value={pin}
        onChange={setPin}
        onSubmit={submit}
        minLength={PIN_MIN_LENGTH}
        maxLength={PIN_MAX_LENGTH}
        labels={{
          delete: t('pinPad.delete'),
          submit: t('pinPad.submit'),
          digits: (n) => t('pinPad.digits', { count: n }),
        }}
      />

      {mode !== 'disable' && step !== 'verify' ? (
        <Card className="mx-2">
          <Text variant="caption">{t('setup.warning')}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
