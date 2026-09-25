import { Platform, Switch, type SwitchProps } from 'react-native';

import { colorOf, useAppColorScheme } from '@/shared/theme';

/** Themed switch: ink track when on (yellow in dark mode), neutral when off, white thumb. */
export function Toggle({ disabled, ...props }: SwitchProps) {
  const scheme = useAppColorScheme();
  const off = colorOf(scheme, 'border');
  return (
    <Switch
      trackColor={{ false: off, true: colorOf(scheme, 'primary') }}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      ios_backgroundColor={off}
      disabled={disabled}
      style={disabled ? { opacity: 0.4 } : undefined}
      {...props}
    />
  );
}
