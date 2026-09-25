import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from './text';

type EmptyStateProps = { title: string; description?: string; action?: ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Text variant="subtitle" className="text-center">
        {title}
      </Text>
      {description ? (
        <Text variant="caption" className="text-center">
          {description}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
