import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { colorOf, useAppColorScheme } from '@/shared/theme';
import { Button, Icon, type IconName, Screen, Text } from '@/shared/ui';

import { completeOnboarding } from '../hooks/use-onboarding';

const SLIDES: { key: 'welcome' | 'capture' | 'privacy' | 'pin'; icon: IconName }[] = [
  { key: 'welcome', icon: 'photos' },
  { key: 'capture', icon: 'camera' },
  { key: 'privacy', icon: 'lock' },
  { key: 'pin', icon: 'biometrics' },
];

export function OnboardingScreen() {
  const { t } = useTranslation();
  const scheme = useAppColorScheme();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

  const finish = (createPin: boolean) => {
    completeOnboarding();
    router.replace('/');
    if (createPin) router.push({ pathname: '/security/pin', params: { mode: 'create' } });
  };

  return (
    <Screen className="justify-between pb-10">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="items-end pt-2">
        {!isLast ? (
          <Button variant="ghost" label={t('onboarding.skip')} onPress={() => finish(false)} />
        ) : null}
      </View>

      <View className="items-center gap-6 px-4" accessibilityLiveRegion="polite">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-surface-muted">
          <Icon name={slide.icon} size={52} color={colorOf(scheme, 'primary')} />
        </View>
        <Text variant="title" className="text-center" accessibilityRole="header">
          {t(`onboarding.slides.${slide.key}.title`)}
        </Text>
        <Text className="text-center text-muted">{t(`onboarding.slides.${slide.key}.body`)}</Text>
      </View>

      <View className="gap-4">
        <View
          className="flex-row justify-center gap-2"
          accessible
          accessibilityLabel={`${index + 1}/${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={
                i === index ? 'h-2 w-6 rounded-full bg-primary' : 'h-2 w-2 rounded-full bg-border'
              }
            />
          ))}
        </View>
        {isLast ? (
          <>
            <Button label={t('onboarding.createPin')} onPress={() => finish(true)} />
            <Button variant="ghost" label={t('onboarding.later')} onPress={() => finish(false)} />
          </>
        ) : (
          <Button label={t('onboarding.next')} onPress={() => setIndex((i) => i + 1)} />
        )}
      </View>
    </Screen>
  );
}
