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
        peach: '#FBFAF8', // primary background (body, sections) — off-white
        'peach-light': '#FFF4E8', // paper / card background (lightest)
        'peach-warm': '#F3D2B8', // secondary background (deeper accents)
        // Text (text-forest*, text-mauve*)
        forest: '#7A6758', // secondary text (body)
        'forest-deep': '#3D3229', // primary text (headings, CTA bg)
        title: '#535351', // todo o texto do site
        cta: '#69B4DF', // botões de ação — azul da aquarela do convite, hsl(202 65% 64%)
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
        // As três fontes do save the date. Ver @font-face em src/index.css.
        //   títulos    → Amsterdam (script)
        //   subtítulos → Arbotek (sans geométrica)
        //   texto      → Geralda, com Cormorant Garamond atrás
        //
        // Amsterdam — script dos títulos. Garamond fica atrás só para cobrir
        // glifos que a fonte não tem (° º).
        display: ['Amsterdam', '"Cormorant Garamond"', 'cursive'],
        script: ['Amsterdam', '"Cormorant Garamond"', 'cursive'],
        // Jost — subtítulos, datas, números, interface. A script não é legível
        // em número nem em rótulo pequeno; tudo isso vem para cá. Substituiu a
        // Arbotek, cujo S maiúsculo era desenhado como uma barra diagonal
        // ("Silva" saía "/ilva") — inviável num site cheio de nomes próprios.
        sans: ['Jost', 'system-ui', 'sans-serif'],
        // Cormorant Garamond — corpo de texto. É uma serifada de texto, com
        // itálico e vários pesos reais; a Geralda, de corte único e desenho de
        // display, não sustentava leitura em tamanho pequeno.
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        garamond: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        // Geralda continua disponível para uso pontual: font-geralda.
        geralda: ['Geralda', '"Cormorant Garamond"', 'Georgia', 'serif'],
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
