import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // INVERTED scheme: violet on the page, peach on top.
        // The "peach" keys now hold the violet canvas tones (used by
        // every bg-peach* class — body bg, sections, paper cards), and
        // the "forest"/"mauve" keys now hold the peach text tones (used
        // by every text-forest* / text-mauve* class). Key names are
        // preserved so no section file needs to change.
        // The literal hexes #4E784F / #3F6041 / #ADB897 inside SVG
        // vines, stems, and leaves are unchanged — they stay green so
        // the only green on the page is the botanical illustration.
        peach: '#6B5560', // was peach — now medium plum-violet (body bg)
        'peach-light': '#7A6470', // was peach-light — now lighter violet (cards, elevated bg)
        'peach-warm': '#5C4750', // was peach-warm — now deep plum (deeper bg accents)
        forest: '#F4DBC4', // was forest green — now warm peach (body text)
        'forest-deep': '#FAE8D6', // was forest-deep — now light peach (headings, CTA bg)
        mauve: '#EDD2BB', // was mauve grey — now medium peach (subtitles)
        'mauve-light': '#F4DBC4', // was mauve-light — now warm peach (soft text)
        // Sage kept green — used for soft borders and leaf decoration.
        sage: '#ADB897',
        'sage-light': '#C3CBB2',
        // Warm accents remapped to peach tones to keep all text/borders
        // in the peach family on the violet canvas.
        amber: '#EDD2BB', // kicker labels
        gold: '#FAE8D6', // soft accents
        terracotta: '#F4DBC4', // errors / warm accents
        honey: '#FAE8D6', // prices, countdown numbers
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
