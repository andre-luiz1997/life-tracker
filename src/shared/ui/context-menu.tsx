import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { cn } from '@/shared/lib/cn';
import { colorOf, softShadow, useAppColorScheme } from '@/shared/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ContextMenuItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
};

type ContextMenuProps = {
  /** Screen coordinates where the menu should appear (e.g. the long-press point). */
  anchor: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
  title?: string;
  /** Accessible label of the backdrop that closes the menu. */
  closeLabel: string;
};

const WIDTH = 232;
const ITEM_HEIGHT = 52;
const MARGIN = 16;

/** Small popover menu anchored at a point; tapping outside closes it. */
export function ContextMenu({ anchor, items, onClose, title, closeLabel }: ContextMenuProps) {
  const scheme = useAppColorScheme();
  const { width, height } = useWindowDimensions();
  if (!anchor) return null;

  const menuHeight = items.length * ITEM_HEIGHT + (title ? 40 : 0) + 12;
  const left = Math.min(Math.max(anchor.x - WIDTH / 2, MARGIN), width - WIDTH - MARGIN);
  // Open below the finger, or above it when there's no room.
  const below = anchor.y + 12 + menuHeight < height - MARGIN;
  const top = below ? anchor.y + 12 : Math.max(MARGIN, anchor.y - menuHeight - 12);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        className="flex-1"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}>
        <Animated.View entering={FadeIn.duration(120)} className="absolute inset-0 bg-black/25" />
      </Pressable>
      <Animated.View
        entering={ZoomIn.duration(160)}
        accessibilityViewIsModal
        className="absolute rounded-3xl bg-surface p-1.5"
        style={{ left, top, width: WIDTH, boxShadow: softShadow }}>
        {title ? (
          <Text variant="caption" numberOfLines={1} className="px-3.5 pb-1 pt-2.5">
            {title}
          </Text>
        ) : null}
        {items.map((item, i) => (
          <View key={item.label}>
            {i > 0 ? <View className="mx-3 h-px bg-border" /> : null}
            <Pressable
              accessibilityRole="menuitem"
              onPress={() => {
                onClose();
                item.onPress();
              }}
              className="flex-row items-center gap-3 rounded-2xl px-3.5 active:bg-surface-muted"
              style={{ height: ITEM_HEIGHT }}>
              <Icon
                name={item.icon}
                size={20}
                color={colorOf(scheme, item.destructive ? 'danger' : 'foreground')}
              />
              <Text
                className={cn(
                  'font-body-medium',
                  item.destructive ? 'text-danger' : 'text-foreground',
                )}>
                {item.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </Animated.View>
    </Modal>
  );
}
