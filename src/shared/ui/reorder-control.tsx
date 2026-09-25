import { View } from 'react-native';

import { IconButton } from './icon-button';

type ReorderControlProps = {
  onUp: () => void;
  onDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  labels: { up: string; down: string };
};

/** Up/down buttons joined in a single pill. */
export function ReorderControl({
  onUp,
  onDown,
  canMoveUp,
  canMoveDown,
  labels,
}: ReorderControlProps) {
  return (
    <View className="flex-row items-center rounded-full bg-surface p-0.5">
      <IconButton
        icon="chevron-up"
        size={18}
        diameter={32}
        disabled={!canMoveUp}
        accessibilityLabel={labels.up}
        onPress={onUp}
      />
      <IconButton
        icon="chevron-down"
        size={18}
        diameter={32}
        disabled={!canMoveDown}
        accessibilityLabel={labels.down}
        onPress={onDown}
      />
    </View>
  );
}
