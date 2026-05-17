import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Saisei-style palette. Key names preserved so no section file
        // needs to change — the underlying tones are warm cream/peach
        // with dark warm-brown text and green/rose/amber accents.
        //
        // Canvas (bg-peach*)
        peach: '#F8E8D8', // primary background (body, sections)
        'peach-light': '#FFF4E8', // paper / card background (lightest)
        'peach-warm': '#F3D2B8', // secondary background (deeper accents)
        // Text (text-forest*, text-mauve*)
        forest: '#7A6758', // secondary text (body)
        'forest-deep': '#3D3229', // primary text (headings, CTA bg)
        mauve: '#A88A9D', // muted mauve — subtitle / accent
        'mauve-light': '#B9AFC1', // faded lilac — soft text / decoration
        // Greens — used for botanical detail (leaves, vines, sage borders)
        sage: '#B8C2A3', // soft sage — light leaf fill, soft borders
        'sage-light': '#D0D8B8', // lighter sage tint
        // Warm accents
        amber: '#D89A35', // honey amber — kicker labels, price weight
        gold: '#C58A7A', // dusty rose — soft accents
        terracotta: '#B96F52', // clay terracotta — error / accent
        honey: '#D89A35', // alias of amber — prices, countdown numbers
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
