import { Pressable, View } from 'react-native';

import { Icon } from '@/shared/ui';

import { TIMELINE_COLORS } from '../templates';
import { INK } from './timeline-icon';

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
            className={
              selected
                ? 'h-12 w-12 items-center justify-center rounded-full border-[3px] border-primary'
                : 'h-12 w-12 items-center justify-center rounded-full'
            }
            style={{ backgroundColor: color }}>
            {selected ? <Icon name="check" size={20} color={INK} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
