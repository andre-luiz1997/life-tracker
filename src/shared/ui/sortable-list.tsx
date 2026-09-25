import * as Haptics from 'expo-haptics';
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colorOf, useAppColorScheme } from '@/shared/theme';

import { moveTo, orderOf, type Positions, positionsFrom, slotAt } from '../lib/sortable';
import { Icon } from './icon';

const SPRING = { damping: 22, stiffness: 260, mass: 0.6 };

type SortableListProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  /** Fixed slot height, including the gap between rows. */
  rowHeight: number;
  gap?: number;
  /** `handle` is the drag grip to place inside the row. */
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  /** New order of keys after a drop (only called when it changed). */
  onReorder: (keys: string[]) => void;
  /** Screen-reader alternative to dragging. */
  onMove: (key: string, direction: 'up' | 'down') => void;
  labels: { handle: string; up: string; down: string };
};

/**
 * Drag-and-drop list: drag a row by its grip; the others slide out of the way. Runs on the UI
 * thread (Reanimated), and commits the order once, on drop.
 */
export function SortableList<T>({
  items,
  keyOf,
  rowHeight,
  gap = 8,
  renderItem,
  onReorder,
  onMove,
  labels,
}: SortableListProps<T>) {
  const keys = items.map(keyOf);
  const signature = keys.join('|');
  const positions = useSharedValue<Positions>(positionsFrom(keys));

  // The list is re-queried after each change: resync slots with the persisted order.
  useEffect(() => {
    positions.set(positionsFrom(signature ? signature.split('|') : []));
  }, [signature, positions]);

  const commit = (next: Positions) => {
    const order = orderOf(next);
    if (order.join('|') !== signature) onReorder(order);
  };

  return (
    <View style={{ height: Math.max(0, items.length * rowHeight - gap) }}>
      {items.map((item, index) => {
        const key = keyOf(item);
        return (
          <SortableRow
            key={key}
            id={key}
            index={index}
            count={items.length}
            positions={positions}
            rowHeight={rowHeight}
            gap={gap}
            onDrop={commit}
            onMove={(direction) => onMove(key, direction)}
            labels={labels}
            render={(handle) => renderItem(item, handle)}
          />
        );
      })}
    </View>
  );
}

type RowProps = {
  id: string;
  index: number;
  count: number;
  positions: SharedValue<Positions>;
  rowHeight: number;
  gap: number;
  onDrop: (positions: Positions) => void;
  onMove: (direction: 'up' | 'down') => void;
  labels: SortableListProps<unknown>['labels'];
  render: (handle: ReactNode) => ReactNode;
};

function SortableRow({
  id,
  index,
  count,
  positions,
  rowHeight,
  gap,
  onDrop,
  onMove,
  labels,
  render,
}: RowProps) {
  const scheme = useAppColorScheme();
  const top = useSharedValue(index * rowHeight);
  const start = useSharedValue(0);
  const active = useSharedValue(false);

  // Follow slot changes (other rows being dragged past this one, or a DB reorder).
  useAnimatedReaction(
    () => positions.get()[id],
    (slot, previous) => {
      if (slot === undefined || slot === previous || active.get()) return;
      top.set(withSpring(slot * rowHeight, SPRING));
    },
  );

  const tick = () => Haptics.selectionAsync().catch(() => {});

  const drag = Gesture.Pan()
    .minDistance(0)
    .onStart(() => {
      active.set(true);
      start.set(top.get());
      scheduleOnRN(tick);
    })
    .onUpdate((e) => {
      const y = Math.max(
        -rowHeight / 2,
        Math.min((count - 0.5) * rowHeight, start.get() + e.translationY),
      );
      top.set(y);
      const slot = slotAt(y, rowHeight, count);
      if (slot !== positions.get()[id]) {
        positions.set(moveTo(positions.get(), id, slot));
        scheduleOnRN(tick);
      }
    })
    .onFinalize(() => {
      if (!active.get()) return;
      const slot = positions.get()[id] ?? 0;
      top.set(withSpring(slot * rowHeight, SPRING));
      active.set(false);
      scheduleOnRN(onDrop, positions.get());
    });

  const style = useAnimatedStyle(() => ({
    top: top.get(),
    zIndex: active.get() ? 10 : 0,
    transform: [{ scale: withTiming(active.get() ? 1.03 : 1, { duration: 120 }) }],
    boxShadow: active.get() ? '0px 10px 24px rgba(33,33,33,0.18)' : '0px 0px 0px rgba(0,0,0,0)',
  }));

  const handle = (
    <GestureDetector gesture={drag}>
      <View
        className="h-11 w-8 items-center justify-center"
        hitSlop={6}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={labels.handle}
        accessibilityActions={[
          { name: 'decrement', label: labels.up },
          { name: 'increment', label: labels.down },
        ]}
        onAccessibilityAction={(e) =>
          onMove(e.nativeEvent.actionName === 'decrement' ? 'up' : 'down')
        }>
        <Icon name="drag" size={22} color={colorOf(scheme, 'muted')} />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View
      className="absolute left-0 right-0 rounded-2xl"
      style={[{ height: rowHeight - gap }, style]}>
      {render(handle)}
    </Animated.View>
  );
}
