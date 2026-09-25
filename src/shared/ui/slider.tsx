import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { Text } from './text';

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Called on every drag frame. */
  onChange: (value: number) => void;
  /** Called once when a drag starts (e.g. to create an undo checkpoint). */
  onChangeStart?: () => void;
  /** Accessibility increment/decrement step. */
  step?: number;
  formatValue?: (value: number) => string;
};

const THUMB = 24;

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  onChangeStart,
  step = (max - min) / 20,
  formatValue = (v) => v.toFixed(2),
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const startValue = useSharedValue(value);
  const ratio = (value - min) / (max - min);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      onChangeStart?.();
      // Tapping the track jumps to that point.
      const next = clamp(min + ((e.x - THUMB / 2) / Math.max(1, width - THUMB)) * (max - min));
      startValue.set(next);
      onChange(next);
    })
    .onUpdate((e) => {
      onChange(
        clamp(startValue.get() + (e.translationX / Math.max(1, width - THUMB)) * (max - min)),
      );
    });

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text variant="caption" className="font-body-medium">
          {label}
        </Text>
        <Text variant="caption">{formatValue(value)}</Text>
      </View>
      <GestureDetector gesture={pan}>
        <View
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ text: formatValue(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            onChangeStart?.();
            onChange(clamp(value + (e.nativeEvent.actionName === 'increment' ? step : -step)));
          }}
          className="h-10 justify-center">
          <View className="h-1 rounded-full bg-surface-muted" />
          <View
            className="absolute h-1 rounded-full bg-primary"
            style={{ width: THUMB / 2 + ratio * Math.max(0, width - THUMB) }}
          />
          <View
            className="absolute rounded-full border border-border bg-surface shadow"
            style={{ width: THUMB, height: THUMB, left: ratio * Math.max(0, width - THUMB) }}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
