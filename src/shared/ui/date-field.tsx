import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';

import { Text } from './text';

type DateFieldProps = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  locale: string;
  maximumDate?: Date;
};

/** Native date/time picker: inline compact control on iOS, system dialog on Android. */
export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  locale,
  maximumDate,
}: DateFieldProps) {
  // Fired only when a value is picked (dismissals go to onDismiss, which we don't need).
  const handle = (_: unknown, date: Date) => onChange(date);

  const formatted =
    mode === 'date'
      ? value.toLocaleDateString(locale, { dateStyle: 'long' })
      : value.toLocaleTimeString(locale, { timeStyle: 'short' });

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="caption" className="font-body-medium">
        {label}
      </Text>
      {Platform.OS === 'ios' ? (
        <RNDateTimePicker
          value={value}
          mode={mode}
          display="compact"
          locale={locale}
          maximumDate={maximumDate}
          onValueChange={handle}
          accessibilityLabel={label}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${formatted}`}
          onPress={() =>
            DateTimePickerAndroid.open({
              value,
              mode,
              maximumDate,
              onValueChange: handle,
              is24Hour: true,
            })
          }
          className="rounded-lg bg-surface-muted px-3 py-2">
          <Text>{formatted}</Text>
        </Pressable>
      )}
    </View>
  );
}
