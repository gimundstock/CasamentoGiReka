// Every image the Brasília passport uses, in one place (public/passport/).
//
//   cover.webp         front cover: blank cream board, double gold rule
//   cover-inside.webp  inside of the cover: endpaper with botanical sprigs
//   spread.webp        the open book seen from above (pages, stacks, gold board)
//   paper.webp         a loose page: the faces of the leaves that turn
//   blot-mask.webp     the watercolor blot the painting shrinks into (alpha mask)
//
// Still to come, one illustration per chapter (left page of each opener):
//   tourism.webp, restaurants.webp, transport.webp, hotels.webp
// Until then `ASSETS.illustrations` crops art the site already has; swapping
// one in is a one-line change (see the comment there).
//
// The book's layout is measured from spread.webp (SPREAD below) — if that
// image is re-exported at another crop, re-measure those numbers.

const BASE = import.meta.env.BASE_URL
/** Path of a file in public/passport/. */
export const passport = (file: string) => `${BASE}passport/${file}`

/** The painting the vignette is cut from (also the inside-cover crop). */
export const PAINT_SRC = `${BASE}cerrado/paint.webp`
export const PAINT_ASPECT = 1376 / 768

/**
 * spread.webp, measured in its own pixels: the cream area of each page, and
 * where the image is split between its two halves (the gutter).
 */
export const SPREAD = {
  w: 1476,
  h: 956,
  split: 736,
  left: { x: 55, y: 4, w: 680, h: 926 },
  right: { x: 738, y: 4, w: 684, h: 926 },
}

/** Width / height of blot-mask.webp. */
export const BLOT_ASPECT = 760 / 483
/**
 * Radius (as a fraction of the mask's height) inside which blot-mask.webp is
 * fully opaque all around its center (measured: 0.405; kept with a margin).
 * Sets how big the mask must start for the blot to cover the whole screen.
 */
export const BLOT_CORE = 0.36

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
  coverInside: passport('cover-inside.webp'),
  spread: passport('spread.webp'),
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
