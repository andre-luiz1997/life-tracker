import type { Ref } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, fonts, useAppColorScheme } from '@/shared/theme';

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
  style,
  ...props
}: TextFieldProps) {
  const scheme = useAppColorScheme();
  return (
    <View className={cn('gap-2', containerClassName)}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={colorOf(scheme, 'muted')}
        className={cn(
          'min-h-14 rounded-2xl border bg-surface-muted px-5 text-base text-foreground',
          error ? 'border-danger' : 'border-transparent',
          className,
        )}
        // Custom fonts must be set per element on TextInput.
        style={[{ fontFamily: fonts.regular }, style]}
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
