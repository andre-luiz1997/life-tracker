import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

const base = 'rounded-2xl border border-border bg-surface p-4';

export function Card({ className, ...props }: ViewProps) {
  return <View className={cn(base, className)} {...props} />;
}

export function PressableCard({ className, ...props }: PressableProps & { className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(base, 'active:opacity-80', className)}
      {...props}
    />
  );
}
