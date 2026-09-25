import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, useAppColorScheme } from '@/shared/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type PinPadProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength: number;
  minLength: number;
  disabled?: boolean;
  /** Accessible labels (i18n comes from the caller). */
  labels: { delete: string; submit: string; digits: (n: number) => string };
  /** Extra key in the bottom-left slot (e.g. biometrics). */
  leftAction?: { icon: IconName; label: string; onPress: () => void };
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinPad({
  value,
  onChange,
  onSubmit,
  maxLength,
  minLength,
  disabled,
  labels,
  leftAction,
}: PinPadProps) {
  const scheme = useAppColorScheme();
  const press = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(value + digit);
  };

  const key = (
    content: React.ReactNode,
    onPress: () => void,
    label: string,
    isDisabled = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || isDisabled}
      onPress={onPress}
      className={cn(
        'h-16 w-16 items-center justify-center rounded-full active:bg-surface-muted',
        (disabled || isDisabled) && 'opacity-30',
      )}>
      {content}
    </Pressable>
  );

  return (
    <View className="items-center gap-8">
      <View
        className="flex-row gap-3"
        accessible
        accessibilityLabel={labels.digits(value.length)}
        accessibilityLiveRegion="polite">
        {Array.from({ length: maxLength }, (_, i) => (
          <View
            key={i}
            className={cn(
              'h-3.5 w-3.5 rounded-full border-2 border-foreground',
              i < value.length && 'bg-foreground',
              i >= minLength && i >= value.length && 'opacity-30',
            )}
          />
        ))}
      </View>

      <View className="w-64 flex-row flex-wrap justify-between gap-y-3">
        {KEYS.map((d) => (
          <View key={d}>{key(<Text className="text-3xl">{d}</Text>, () => press(d), d)}</View>
        ))}
        <View className="h-16 w-16">
          {leftAction
            ? key(
                <Icon name={leftAction.icon} size={28} color={colorOf(scheme, 'primary')} />,
                leftAction.onPress,
                leftAction.label,
              )
            : null}
        </View>
        <View>{key(<Text className="text-3xl">0</Text>, () => press('0'), '0')}</View>
        <View>
          {key(
            <Icon name="undo" size={24} color={colorOf(scheme, 'foreground')} />,
            () => onChange(value.slice(0, -1)),
            labels.delete,
            !value.length,
          )}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels.submit}
        disabled={disabled || value.length < minLength}
        onPress={onSubmit}
        className={cn(
          'rounded-xl bg-primary px-10 py-3',
          (disabled || value.length < minLength) && 'opacity-40',
        )}>
        <Text className="font-semibold text-on-primary">{labels.submit}</Text>
      </Pressable>
    </View>
  );
}
