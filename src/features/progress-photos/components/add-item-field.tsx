import { useState } from 'react';
import { View } from 'react-native';

import { IconButton, TextField } from '@/shared/ui';

type AddItemFieldProps = {
  placeholder: string;
  accessibilityLabel: string;
  onAdd: (value: string) => void;
  maxLength?: number;
};

/** Text input + "add" button; clears itself after adding. */
export function AddItemField({
  placeholder,
  accessibilityLabel,
  onAdd,
  maxLength = 40,
}: AddItemFieldProps) {
  const [value, setValue] = useState('');
  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };

  return (
    <View className="flex-row items-center gap-2">
      <TextField
        containerClassName="flex-1"
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="done"
        maxLength={maxLength}
      />
      <IconButton
        icon="plus"
        color="primary"
        accessibilityLabel={accessibilityLabel}
        disabled={!value.trim()}
        onPress={submit}
      />
    </View>
  );
}
