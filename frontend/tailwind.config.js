/** @type {import('tailwindcss').Config} */
export default {
content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#14246B',
          700: '#0F1B52', // hover / pressed
          900: '#0A1238', // deep accent, unused for now but reserves the slot
        },
        paper: '#F4EFE6',
        ink: '#11172B',
        marigold: '#F2A93B',
        verified: '#1F7A4D',
        chalk: '#E2D9C6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
      },
      maxWidth: {
        container: '1200px',
      },
      spacing: {
        section: '6rem', // 96px desktop section rhythm
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      boxShadow: {
        slip: '0 10px 30px -12px rgba(17, 23, 43, 0.18)',
      },
      keyframes: {
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'reveal-up': 'reveal-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};