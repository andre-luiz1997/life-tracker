import { Pressable, type PressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  selected?: boolean;
  /** `onDark` for chips over photos/camera (translucent white). */
  tone?: 'default' | 'onDark';
  /** Selection semantics for screen readers. */
  role?: 'button' | 'radio' | 'switch';
  className?: string;
};

/** Pill chip: soft yellow, solid yellow when selected. */
export function Chip({
  label,
  selected = false,
  tone = 'default',
  role = 'button',
  className,
  ...props
}: ChipProps) {
  const onDark = tone === 'onDark';
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'switch' ? { checked: selected } : { selected }}
      className={cn(
        'min-h-9 items-center justify-center rounded-full px-4 active:opacity-80',
        onDark
          ? selected
            ? 'bg-white'
            : 'bg-white/20'
          : selected
            ? 'bg-accent'
            : 'bg-accent-soft',
        className,
      )}
      {...props}>
      <Text
        numberOfLines={1}
        className={cn(
          'font-body-medium text-sm',
          onDark ? (selected ? 'text-black' : 'text-white') : 'text-foreground',
        )}>
        {label}
      </Text>
    </Pressable>
  );
}
