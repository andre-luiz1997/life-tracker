import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

type TagProps = {
  label: string;
  /** `surface` = white pill (on colored cards); `soft` = yellow tint; `outline` = bordered. */
  tone?: 'surface' | 'soft' | 'outline';
  /** Custom tinted background (e.g. a translucent pastel); text keeps the theme color. */
  color?: string;
  className?: string;
};

/** Small static pill for metadata (counts, dates, durations). */
export function Tag({ label, tone = 'surface', color, className }: TagProps) {
  return (
    <View
      className={cn(
        'rounded-full px-3 py-1',
        !color && tone === 'surface' && 'bg-surface',
        tone === 'soft' && 'bg-accent-soft',
        tone === 'outline' && 'border border-border',
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}>
      <Text className="font-body-medium text-xs text-foreground" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
