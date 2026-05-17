import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas: soft mauve-cream (renamed semantically from "peach" —
        // keys kept so existing bg-peach* classes pick up the new tones).
        // Shifts the page undertone away from green/yellow toward dusty
        // violet while staying light enough to read as paper.
        peach: '#EFE6E4',
        'peach-light': '#F7F1F0',
        'peach-warm': '#E6DAD8',
        mauve: '#AA9DA9',
        'mauve-light': '#B9A8B5',
        sage: '#ADB897',
        'sage-light': '#C3CBB2',
        forest: '#4E784F',
        'forest-deep': '#3F6041',
        // Warm-accent keys retargeted to muted mauve/sage tones so the
        // palette settles into a cream + green + mauve scheme. Names
        // kept stable so existing classes pick up the new tones silently.
        amber: '#8C7480',
        gold: '#A39584',
        terracotta: '#9A7F84',
        honey: '#5A7956',
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
