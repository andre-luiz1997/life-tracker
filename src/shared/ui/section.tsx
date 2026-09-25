import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

type SectionProps = PropsWithChildren<{
  title: string;
  hint?: string;
  /** Right-aligned element next to the title (e.g. a "see all" link). */
  action?: ReactNode;
  className?: string;
}>;

export function Section({ title, hint, action, className, children }: SectionProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text variant="subtitle" accessibilityRole="header">
            {title}
          </Text>
          {action}
        </View>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
