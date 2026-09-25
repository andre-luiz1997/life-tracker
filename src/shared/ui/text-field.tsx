import type { Ref } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, useAppColorScheme } from '@/shared/theme';

import { Text } from './text';

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  error,
  containerClassName,
  className,
  ref,
  ...props
}: TextFieldProps) {
  const scheme = useAppColorScheme();
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant="caption" className="font-medium">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colorOf(scheme, 'muted')}
        className={cn(
          'min-h-12 rounded-xl border bg-surface px-4 text-base text-foreground',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...props}
      />
      {error ? (
        <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
