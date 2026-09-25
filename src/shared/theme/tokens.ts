/**
 * Semantic color tokens as "R G B" triplets, consumed by Tailwind via CSS variables
 * (see tailwind.config.js). Keep the keys in sync with the Tailwind color names.
 *
 * Palette: warm yellow accent (#F7D786), near-black ink (#212121), grey (#909090), white.
 * Light mode uses black for primary actions; dark mode uses the yellow instead.
 */
export const palettes = {
  light: {
    background: '250 250 248',
    surface: '255 255 255',
    'surface-muted': '245 244 240',
    border: '236 235 230',
    foreground: '33 33 33',
    muted: '144 144 144',
    primary: '33 33 33',
    'on-primary': '255 255 255',
    accent: '247 215 134',
    'on-accent': '33 33 33',
    'accent-soft': '251 239 206',
    /** Content over photos/camera: white in both schemes. */
    'on-dark': '255 255 255',
    danger: '229 83 75',
    success: '76 175 120',
  },
  dark: {
    background: '18 18 18',
    surface: '30 30 30',
    'surface-muted': '42 42 40',
    border: '52 52 50',
    foreground: '245 245 240',
    muted: '160 160 155',
    primary: '247 215 134',
    'on-primary': '33 33 33',
    accent: '247 215 134',
    'on-accent': '33 33 33',
    'accent-soft': '74 64 38',
    'on-dark': '255 255 255',
    danger: '248 113 113',
    success: '110 220 150',
  },
} as const;

export type ColorScheme = keyof typeof palettes;
export type ColorToken = keyof (typeof palettes)['light'];

/** Hex/rgb value for places that can't use className (navigation, status bar, Skia). */
export function colorOf(scheme: ColorScheme, token: ColorToken): string {
  return `rgb(${palettes[scheme][token].replaceAll(' ', ',')})`;
}

/** Palanquin families per weight (custom fonts need one family per weight on Android). */
export const fonts = {
  regular: 'Palanquin_400Regular',
  medium: 'Palanquin_500Medium',
  semibold: 'Palanquin_600SemiBold',
  bold: 'Palanquin_700Bold',
} as const;

/** Soft, diffuse elevation used by cards and floating controls (RN `boxShadow`). */
export const softShadow = '0px 6px 20px rgba(33, 33, 33, 0.07)';
