import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, type ColorToken, useAppColorScheme } from '@/shared/theme';

import { Text } from './text';

/**
 * Pill buttons: solid ink for the main action, outline for secondary, yellow accent.
 * `onDark` is the translucent white used over photos/camera (same look as `Chip tone="onDark"`).
 */
const containerVariants = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  secondary: 'border border-border bg-surface',
  danger: 'bg-danger/10',
  ghost: 'bg-transparent',
  onDark: 'border border-white/50 bg-white/25',
} as const;

const labelVariants: Record<keyof typeof containerVariants, string> = {
  primary: 'text-on-primary',
  accent: 'text-on-accent',
  secondary: 'text-foreground',
  danger: 'text-danger',
  ghost: 'text-foreground',
  onDark: 'text-on-dark',
};

const spinnerColor: Record<keyof typeof containerVariants, ColorToken> = {
  primary: 'on-primary',
  accent: 'on-accent',
  secondary: 'foreground',
  danger: 'danger',
  ghost: 'foreground',
  onDark: 'on-dark',
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: keyof typeof containerVariants;
  size?: 'md' | 'sm';
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const scheme = useAppColorScheme();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center rounded-full active:opacity-80',
        size === 'md' ? 'min-h-14 px-6' : 'min-h-10 px-4',
        containerVariants[variant],
        isDisabled && 'opacity-40',
        className,
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator color={colorOf(scheme, spinnerColor[variant])} />
      ) : (
        <Text
          numberOfLines={1}
          className={cn(
            'font-body-semibold',
            size === 'md' ? 'text-base' : 'text-sm',
            labelVariants[variant],
          )}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
