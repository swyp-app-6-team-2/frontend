/** @type {import('tailwindcss').Config} */

// Reference a CSS variable as an rgb() color with alpha-channel support,
// so opacity modifiers like `bg-primary/50` work. Vars live in src/global.css.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: token('--color-background'),
        surface: token('--color-surface'),
        field: token('--color-field'),
        primary: token('--color-primary'),
        'primary-subtle': token('--color-primary-subtle'),
        'on-primary': token('--color-on-primary'),
        foreground: token('--color-foreground'),
        ink: token('--color-ink'),
        muted: token('--color-muted'),
        'tab-inactive': token('--color-tab-inactive'),
        'body-muted': token('--color-body-muted'),
        disabled: token('--color-disabled'),
        'popup-button': token('--color-popup-button'),
        'popup-button-text': token('--color-popup-button-text'),
        success: token('--color-success'),
        error: token('--color-error'),
      },
      fontSize: {
        // [size, { lineHeight }] — Figma: title(screen header) Bold 24, subheading Bold 22, body Medium 16, chip Regular 14
        title: ['24px', { lineHeight: '32px' }],
        subheading: ['22px', { lineHeight: '30px' }],
        body: ['16px', { lineHeight: '24px' }],
        chip: ['14px', { lineHeight: '20px' }],
      },
      spacing: {
        screen: '20px', // horizontal screen margin
        gutter: '16px', // gap between elements
      },
      borderRadius: {
        pill: '9999px', // buttons, chips, search bar
        card: '20px', // cards, popups
      },
    },
  },
  plugins: [],
};
