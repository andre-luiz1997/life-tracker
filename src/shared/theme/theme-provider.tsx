import { vars } from 'nativewind';
import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';

import { type ColorScheme, palettes } from './tokens';

const themeVars = {
  light: vars(toCssVars(palettes.light)),
  dark: vars(toCssVars(palettes.dark)),
};

function toCssVars(palette: Record<string, string>) {
  return Object.fromEntries(Object.entries(palette).map(([k, v]) => [`--color-${k}`, v]));
}

const ColorSchemeContext = createContext<ColorScheme>('light');

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'dark' ? 'dark' : 'light';
  const style = useMemo(() => [{ flex: 1 }, themeVars[scheme]], [scheme]);

  return (
    <ColorSchemeContext.Provider value={scheme}>
      <View style={style}>{children}</View>
    </ColorSchemeContext.Provider>
  );
}

export function useAppColorScheme(): ColorScheme {
  return useContext(ColorSchemeContext);
}
