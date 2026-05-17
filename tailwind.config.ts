import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Canvas: warm peach (the wedding's golden-hour skin tone).
        peach: '#F4DBC4',
        'peach-light': '#FAE8D6',
        'peach-warm': '#EDD2BB',
        // Mauve carries the identity — headings, body, buttons. The keys
        // named "forest"/"forest-deep" are intentionally repointed to deep
        // plum tones so every existing text-forest* / bg-forest-deep class
        // shifts to violet without touching section files. The literal
        // green hexes (#4E784F, #3F6041) remain inside SVG vines/leaves
        // so botanical details stay green.
        mauve: '#AA9DA9',
        'mauve-light': '#B9A8B5',
        forest: '#7A6470', // was #4E784F — now plum-mauve for body text
        'forest-deep': '#5C4750', // was #3F6041 — now deep plum for headings/CTAs
        // Sage stays green — used for soft borders and leaf decoration.
        sage: '#ADB897',
        'sage-light': '#C3CBB2',
        // Warm accents kept in the mauve family.
        amber: '#8C7480',
        gold: '#A39584',
        terracotta: '#9A7F84',
        honey: '#8C6F7A', // was sage-green — now dusty rose for prices/numbers
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
