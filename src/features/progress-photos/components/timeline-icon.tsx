import { View } from 'react-native';

import { Icon, type IconName } from '@/shared/ui';

/** Timeline colors are pastels: ink icons read well on them in both color schemes. */
export const INK = '#212121';

type TimelineIconProps = { icon: string; color: string; size?: number };

/** Pastel rounded square with the timeline's icon. */
export function TimelineIcon({ icon, color, size = 48 }: TimelineIconProps) {
  return (
    <View
      className="items-center justify-center"
      style={{ width: size, height: size, borderRadius: size * 0.36, backgroundColor: color }}>
      <Icon name={icon as IconName} color={INK} size={size * 0.5} />
    </View>
  );
}
