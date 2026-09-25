import { View } from 'react-native';

import { Icon, type IconName } from '@/shared/ui';

type TimelineIconProps = { icon: string; color: string; size?: number };

/** Colored rounded badge with the timeline's icon. */
export function TimelineIcon({ icon, color, size = 44 }: TimelineIconProps) {
  return (
    <View
      className="items-center justify-center rounded-xl"
      style={{ width: size, height: size, backgroundColor: `${color}26` }}>
      <Icon name={icon as IconName} color={color} size={size * 0.5} />
    </View>
  );
}
