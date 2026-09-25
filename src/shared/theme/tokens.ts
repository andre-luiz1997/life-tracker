/**
 * Semantic color tokens as "R G B" triplets, consumed by Tailwind via CSS variables
 * (see tailwind.config.js). Keep the keys in sync with the Tailwind color names.
 */
export const palettes = {
  light: {
    background: '248 248 250',
    surface: '255 255 255',
    'surface-muted': '240 240 243',
    border: '224 225 230',
    foreground: '17 17 19',
    muted: '96 100 108',
    primary: '32 138 239',
    'on-primary': '255 255 255',
    danger: '220 38 38',
    success: '22 163 74',
  },
  dark: {
    background: '0 0 0',
    surface: '24 24 27',
    'surface-muted': '33 34 37',
    border: '46 49 53',
    foreground: '245 245 247',
    muted: '176 180 186',
    primary: '77 163 255',
    'on-primary': '255 255 255',
    danger: '248 113 113',
    success: '74 222 128',
  },
} as const;

export type ColorScheme = keyof typeof palettes;
export type ColorToken = keyof (typeof palettes)['light'];

/** Hex/rgb value for places that can't use className (navigation, status bar, Skia). */
export function colorOf(scheme: ColorScheme, token: ColorToken): string {
  return `rgb(${palettes[scheme][token].replaceAll(' ', ',')})`;
}
