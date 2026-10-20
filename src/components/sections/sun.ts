import type { CSSProperties } from 'react'

// The sun starts as the cosmos center in HeroSaveDateCouple and travels
// on into HeroBigDay — both sections draw it with these.
export const SUN_YELLOW = '#FCCC1D'
export const SUN_SIZE = '14vmin'

// Watercolor sun: a pale center, pigment pooled at the rim, a soft wobbly
// edge and paper grain (the #sun-watercolor filter, defined once in
// HeroBigDay), so it sits in the painting instead of on top of it.
export const sunPaint = {
  backgroundImage:
    'radial-gradient(circle at 48% 46%, rgba(255, 244, 200, 0.42) 0%, rgba(255, 236, 170, 0.16) 45%, rgba(255, 236, 170, 0) 66%)',
  boxShadow: 'inset 0 0 1.2vmin 0.5vmin rgba(190, 76, 10, 0.4)',
  filter: 'url(#sun-watercolor)',
} as CSSProperties
