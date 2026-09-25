import type { ReactNode } from 'react';
import { View } from 'react-native';

import { colorOf, useAppColorScheme } from '@/shared/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

type EmptyStateProps = { title: string; description?: string; action?: ReactNode; icon?: IconName };

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  const scheme = useAppColorScheme();
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8">
      {icon ? (
        <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-accent-soft">
          <Icon name={icon} size={40} color={colorOf(scheme, 'foreground')} />
        </View>
      ) : null}
      <Text variant="subtitle" className="text-center text-xl">
        {title}
      </Text>
      {description ? (
        <Text variant="caption" className="text-center text-base">
          {description}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
