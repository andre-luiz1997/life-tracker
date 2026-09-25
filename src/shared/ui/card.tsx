import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { softShadow } from '@/shared/theme';

const base = 'rounded-card bg-surface p-5';

/** Surface card: large radius and a soft shadow instead of a border. */
export function Card({ className, style, ...props }: ViewProps) {
  return (
    <View className={cn(base, className)} style={[{ boxShadow: softShadow }, style]} {...props} />
  );
}

export function PressableCard({
  className,
  style,
  ...props
}: PressableProps & { className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(base, 'active:scale-[0.98] active:opacity-90', className)}
      style={(state) => [
        { boxShadow: softShadow },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    />
  );
}
