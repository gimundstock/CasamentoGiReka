// Every image the Brasília passport uses, in one place (public/passport/).
//
//   cover.webp         cover board, both faces: light cream, double gold rule
//                      (the painted original, its stains and vignette flattened
//                      to an even light cream; the gold rim kept)
//   cover-sprig.webp   one faint botanical sprig for the inside of the cover
//                      (lifted off the painted endpaper onto transparency)
//   paper.webp         every page — lying flat or turning
//   blot-mask.webp     the watercolor blot the painting shrinks into (alpha mask)
//
// The open book around the pages (gold board, page stacks, spine) is CSS.
//
// Still to come, one illustration per chapter (left page of each opener):
//   tourism.webp, restaurants.webp, transport.webp, hotels.webp
// Until then `ASSETS.illustrations` crops art the site already has; swapping
// one in is a one-line change (see the comment there).

const BASE = import.meta.env.BASE_URL
/** Path of a file in public/passport/. */
export const passport = (file: string) => `${BASE}passport/${file}`

/** The painting the vignette is cut from. */
export const PAINT_SRC = `${BASE}cerrado/paint.webp`
export const PAINT_ASPECT = 1376 / 768

/**
 * The open book, in layout units (scaled to the screen in geometry.ts): two
 * pages of 684 × 926 on a board that shows SIDE units around them (where
 * the page stacks sit), split down the middle at the spine.
 */
const PAGE = { w: 684, h: 926 }
const SIDE = 20
const TOP = 13
const GUTTER = 4
export const BOOK = {
  w: 2 * SIDE + 2 * PAGE.w + GUTTER,
  h: 2 * TOP + PAGE.h,
  split: SIDE + PAGE.w + GUTTER / 2,
  left: { x: SIDE, y: TOP, ...PAGE },
  right: { x: SIDE + PAGE.w + GUTTER, y: TOP, ...PAGE },
}

/** Width / height of blot-mask.webp. */
export const BLOT_ASPECT = 760 / 483
/**
 * Radius (as a fraction of the mask's height) inside which blot-mask.webp is
 * fully opaque all around its center (measured: 0.405; kept with a margin).
 * Sets how big the mask must start for the blot to cover the whole screen.
 */
export const BLOT_CORE = 0.36
/**
 * Width / height the blot is drawn at, on the cover and while shrinking:
 * taller than the mask file, so the vignette fills more of the cover.
 */
export const SLOT_ASPECT = 1.22
/** BLOT_CORE once the blot is stretched to SLOT_ASPECT (its sides get relatively nearer). */
export const SLOT_CORE = BLOT_CORE * Math.min(1, SLOT_ASPECT / BLOT_ASPECT)

export interface Illustration {
  src: string
  /** CSS background-size / background-position, to crop a larger painting. */
  size: string
  position: string
  /** Cut into the watercolor blot (paintings) or shown as is (cut-outs). */
  blot: boolean
  /** Optional drawing laid over it (e.g. the cathedral sketch). */
  overlay?: string
}

export const ASSETS = {
  cover: passport('cover.webp'),
  coverSprig: passport('cover-sprig.webp'),
  paper: passport('paper.webp'),
  blotMask: `url(${passport('blot-mask.webp')})`,
  /** The sketch composited on the cover vignette, at its right. */
  coverSketch: `${BASE}illustrations/catedral.png`,
  // Placeholders. When the real art arrives, e.g.:
  //   tourism: { src: passport('tourism.webp'), size: 'contain', position: 'center', blot: false },
  illustrations: {
    tourism: {
      src: PAINT_SRC,
      size: '230% auto',
      position: '72% 22%',
      blot: true,
      overlay: `${BASE}illustrations/catedral.png`,
    },
    restaurants: { src: PAINT_SRC, size: '320% auto', position: '96% 92%', blot: true },
    transport: { src: PAINT_SRC, size: '260% auto', position: '58% 78%', blot: true },
    hotels: { src: `${BASE}flowers/lake.webp`, size: 'contain', position: 'center', blot: false },
  } satisfies Record<string, Illustration>,
}
