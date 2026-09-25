import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/lib/cn';

type ScreenProps = PropsWithChildren<{ className?: string; safeTop?: boolean }>;

export function Screen({ children, className, safeTop = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingTop: safeTop ? insets.top : 0 }}
      className={cn('flex-1 bg-background px-4', className)}>
      {children}
    </View>
  );
}
