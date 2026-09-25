import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, type ColorToken, useAppColorScheme } from '@/shared/theme';

import { Icon, type IconName } from './icon';

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: IconName;
  /** Required: icon-only buttons need an accessible name. */
  accessibilityLabel: string;
  color?: ColorToken;
  size?: number;
  className?: string;
};

export function IconButton({
  icon,
  color = 'foreground',
  size = 22,
  disabled,
  className,
  ...props
}: IconButtonProps) {
  const scheme = useAppColorScheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full active:bg-surface-muted',
        disabled && 'opacity-30',
        className,
      )}
      {...props}>
      <Icon name={icon} size={size} color={colorOf(scheme, color)} />
    </Pressable>
  );
}
