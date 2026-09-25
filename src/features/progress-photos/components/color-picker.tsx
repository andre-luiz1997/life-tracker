import { Pressable, View } from 'react-native';

import { Icon } from '@/shared/ui';

import { TIMELINE_COLORS } from '../templates';

type ColorPickerProps = { value: string; onChange: (color: string) => void; label: string };

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row flex-wrap gap-3">
      {TIMELINE_COLORS.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={color}
            accessibilityRole="radio"
            accessibilityLabel={color}
            accessibilityState={{ selected }}
            onPress={() => onChange(color)}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: color }}>
            {selected ? <Icon name="check" size={18} color="#ffffff" /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
