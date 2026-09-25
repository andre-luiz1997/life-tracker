import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName, Text } from '@/shared/ui';

import { completeOnboarding } from '../hooks/use-onboarding';

/** Pastel backgrounds are the same in light and dark mode, so content uses fixed ink/white. */
const INK = '#212121';

const SLIDES: { key: 'welcome' | 'capture' | 'privacy' | 'pin'; icon: IconName; color: string }[] =
  [
    { key: 'welcome', icon: 'photos', color: '#F7D786' },
    { key: 'capture', icon: 'camera', color: '#B5BEF5' },
    { key: 'privacy', icon: 'lock', color: '#A8E6C3' },
    { key: 'pin', icon: 'biometrics', color: '#F6A58F' },
  ];

export function OnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const prev = SLIDES[(index + SLIDES.length - 1) % SLIDES.length]!;
  const next = SLIDES[(index + 1) % SLIDES.length]!;
  const isLast = index === SLIDES.length - 1;

  const finish = (createPin: boolean) => {
    completeOnboarding();
    router.replace('/');
    if (createPin) router.push({ pathname: '/security/pin', params: { mode: 'create' } });
  };

  return (
    <View
      className="flex-1 justify-between"
      style={{
        backgroundColor: slide.color,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 16,
      }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Progress segments */}
      <View
        className="flex-row gap-2 px-6"
        accessible
        accessibilityLabel={`${index + 1}/${SLIDES.length}`}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            className="h-1 flex-1 rounded-full"
            style={{ backgroundColor: INK, opacity: i <= index ? 0.9 : 0.15 }}
          />
        ))}
      </View>

      <Animated.View
        key={slide.key}
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(150)}
        className="flex-1 items-center justify-center gap-10"
        accessibilityLiveRegion="polite">
        <Text
          variant="display"
          className="px-8 text-center"
          style={{ color: INK }}
          accessibilityRole="header">
          {t(`onboarding.slides.${slide.key}.title`)}
        </Text>

        {/* Center card with the neighbours peeking from the sides */}
        <View className="w-full flex-row items-center justify-center">
          <View
            className="absolute -left-10 h-44 w-24 rounded-[36px]"
            style={{ backgroundColor: prev.color, opacity: 0.9, transform: [{ rotate: '-6deg' }] }}
          />
          <View
            className="absolute -right-10 h-44 w-24 rounded-[36px]"
            style={{ backgroundColor: next.color, opacity: 0.9, transform: [{ rotate: '6deg' }] }}
          />
          <View
            className="h-60 w-60 items-center justify-center rounded-[44px]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.72)',
              transform: [{ rotate: index % 2 ? '3deg' : '-3deg' }],
              boxShadow: '0px 12px 30px rgba(33,33,33,0.12)',
            }}>
            <Icon name={slide.icon} size={96} color={INK} />
          </View>
        </View>

        <Text className="px-10 text-center text-base" style={{ color: INK, opacity: 0.75 }}>
          {t(`onboarding.slides.${slide.key}.body`)}
        </Text>
      </Animated.View>

      <View className="gap-3 px-6">
        <OnboardingButton
          label={isLast ? t('onboarding.later') : t('onboarding.skip')}
          onPress={() => finish(false)}
          outline
        />
        <OnboardingButton
          label={isLast ? t('onboarding.createPin') : t('onboarding.next')}
          onPress={() => (isLast ? finish(true) : setIndex((i) => i + 1))}
        />
      </View>
    </View>
  );
}

function OnboardingButton({
  label,
  onPress,
  outline = false,
}: {
  label: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        'min-h-14 items-center justify-center rounded-full px-6 active:opacity-80',
        outline ? 'border' : '',
      )}
      style={
        outline
          ? { borderColor: 'rgba(33,33,33,0.18)', backgroundColor: 'rgba(255,255,255,0.25)' }
          : { backgroundColor: INK }
      }>
      <Text className="font-body-semibold text-base" style={{ color: outline ? INK : '#FFFFFF' }}>
        {label}
      </Text>
    </Pressable>
  );
}
