const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        border: token('border'),
        foreground: token('foreground'),
        muted: token('muted'),
        primary: token('primary'),
        'on-primary': token('on-primary'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        'accent-soft': token('accent-soft'),
        'on-dark': token('on-dark'),
        danger: token('danger'),
        success: token('success'),
      },
      // One family per weight (see src/shared/theme/tokens.ts). Use these instead of
      // font-medium/font-semibold/font-bold, which would synthesize weights on Android.
      fontFamily: {
        body: ['Palanquin_400Regular'],
        'body-medium': ['Palanquin_500Medium'],
        'body-semibold': ['Palanquin_600SemiBold'],
        'body-bold': ['Palanquin_700Bold'],
      },
      borderRadius: {
        card: '28px',
      },
    },
  },
};
