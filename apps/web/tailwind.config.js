/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Low-literacy/older-audience baseline: everything reads bigger than a typical
      // web app by default, and every tap target clears the 48px/56px thresholds the
      // committee's UX plan called for — see docs/projects/groundtruth.md's audience
      // section. `sm` starts at what most sites treat as their base body size.
      fontSize: {
        sm: ['1rem', '1.5rem'],
        base: ['1.125rem', '1.75rem'],
        lg: ['1.375rem', '2rem'],
        xl: ['1.75rem', '2.25rem'],
        '2xl': ['2.125rem', '2.5rem'],
      },
      spacing: {
        tap: '3.5rem', // 56px — the primary tap-target height used across BigButton/nav
      },
      colors: {
        // Single restrained accent (emerald) + neutrals — see the design canvas
        // ("GroundTruth UI Direction"): modern/clean reads as one accent color used
        // deliberately, not a multi-hue palette.
        brand: {
          DEFAULT: '#0F8A5F',
          dark: '#0B6E4B',
          light: '#E6F6EF',
        },
        ink: '#1C1C1A',
        muted: '#6B6B66',
        faint: '#9A9995',
        surface: '#FAFAF8',
        line: '#EDEBE7',
      },
      borderRadius: {
        // Sharper than Tailwind's defaults on purpose — the earlier fully-rounded
        // pass read dated ("90s website"); this app uses a small, consistent radius
        // scale instead of pills/circles everywhere.
        DEFAULT: '0.375rem', // 6px — chips, filter pills, small icon tiles
        card: '0.5rem', // 8px — cards, buttons, badges
        media: '0.75rem', // 12px — photos (hero, listing images)
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,18,0.04), 0 8px 16px rgba(20,20,18,0.05)',
      },
    },
  },
  plugins: [],
};
