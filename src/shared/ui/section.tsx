import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

type SectionProps = PropsWithChildren<{ title: string; hint?: string; className?: string }>;

export function Section({ title, hint, className, children }: SectionProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="gap-1">
        <Text variant="subtitle" accessibilityRole="header">
          {title}
        </Text>
        {hint ? <Text variant="caption">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}
