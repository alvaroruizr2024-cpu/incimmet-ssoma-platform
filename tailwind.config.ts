import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: { DEFAULT: 'var(--primary)', foreground: '#FFFFFF' },
        brand: {
          navy: '#151F44',
          accent: '#1D7DCC',
          deep: '#002060',
          blue: '#0070C0',
          cyan: '#00B0F0',
        },
      },
      borderRadius: { lg: '12px', md: '6px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'Arial', 'sans-serif'] },
    },
  },
  plugins: [animate],
} satisfies Config;
