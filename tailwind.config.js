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
        danger: token('danger'),
        success: token('success'),
      },
    },
  },
};
