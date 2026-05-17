import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        peach: '#F5D1B2',
        mauve: '#AA9DA9',
        sage: '#ADB897',
        forest: '#4E784F',
        amber: '#DC8000',
        gold: '#DFB100',
        'peach-light': '#FAE6D4',
        'peach-warm': '#F7D8BD',
        'sage-light': '#C3CBB2',
        'forest-deep': '#3F6041',
        'mauve-light': '#B9A8B5',
        terracotta: '#C98262',
        honey: '#DC9A32',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Lato"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        breath: 'breath 4s ease-in-out infinite',
        'drift-down': 'drift-down 18s linear infinite',
        bloom: 'bloom 1.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        breath: {
          '0%, 100%': { opacity: '0.85' },
          '50%': { opacity: '1' },
        },
        'drift-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(120vh)', opacity: '0' },
        },
        bloom: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
