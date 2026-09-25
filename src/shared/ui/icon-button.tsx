import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colorOf, type ColorToken, softShadow, useAppColorScheme } from '@/shared/theme';

import { Icon, type IconName } from './icon';

const variants = {
  /** Bare icon (headers, toolbars). */
  plain: { container: 'active:bg-surface-muted', icon: 'foreground' },
  /** White circle with soft shadow (e.g. avatar-like header actions). */
  surface: { container: 'bg-surface', icon: 'foreground' },
  /** Solid ink circle — the round "play" button from the reference cards. */
  solid: { container: 'bg-primary', icon: 'on-primary' },
  /** Yellow circle. */
  accent: { container: 'bg-accent', icon: 'on-accent' },
  /** Flat white circle, for use on muted rows. */
  soft: { container: 'bg-surface', icon: 'foreground' },
  /** Destructive action: soft red circle. */
  danger: { container: 'bg-danger/10', icon: 'danger' },
} as const satisfies Record<string, { container: string; icon: ColorToken }>;

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: IconName;
  /** Required: icon-only buttons need an accessible name. */
  accessibilityLabel: string;
  variant?: keyof typeof variants;
  /** Overrides the variant's icon color. */
  color?: ColorToken;
  size?: number;
  /** Diameter of the round button. */
  diameter?: number;
  className?: string;
};

export function IconButton({
  icon,
  variant = 'plain',
  color,
  size = 22,
  diameter = 44,
  disabled,
  className,
  style,
  ...props
}: IconButtonProps) {
  const scheme = useAppColorScheme();
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={8}
      className={cn(
        'items-center justify-center rounded-full active:opacity-80',
        v.container,
        disabled && 'opacity-30',
        className,
      )}
      style={(state) => [
        { width: diameter, height: diameter },
        variant === 'surface' && { boxShadow: softShadow },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <Icon name={icon} size={size} color={colorOf(scheme, color ?? v.icon)} />
    </Pressable>
  );
}
