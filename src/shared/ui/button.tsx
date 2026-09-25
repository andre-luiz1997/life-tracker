import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

const containerVariants = {
  primary: 'bg-primary',
  secondary: 'bg-surface-muted',
  danger: 'bg-danger',
  ghost: 'bg-transparent',
} as const;

const labelVariants = {
  primary: 'text-on-primary',
  secondary: 'text-foreground',
  danger: 'text-on-primary',
  ghost: 'text-primary',
} as const;

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: keyof typeof containerVariants;
  loading?: boolean;
  className?: string;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'min-h-12 flex-row items-center justify-center rounded-xl px-5 active:opacity-80',
        containerVariants[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className={cn('font-semibold', labelVariants[variant])}>{label}</Text>
      )}
    </Pressable>
  );
}
