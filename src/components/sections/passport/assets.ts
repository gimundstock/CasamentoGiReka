// Every image the Brasília passport uses, in one place (public/passport/).
// (The back board and the page block's thickness are CSS.)
//
//   cover.webp         front cover: light ivory, double thin gold rule
//   cover-inside.webp  inside of the cover: single gold rule, one sprig in the
//                      bottom-left (the outer corner once the cover lies open)
//   paper.webp         every page — lying flat or turning
//   blot-mask.webp     the watercolor blot the painting shrinks into (alpha mask)
//
//   blot-mask-2.webp   the 'rise' mask: straight sides and bottom, soft top
//   cover-cathedral.webp  the watercolor cathedral on the cover's painting
//   tourism.webp, restaurants.webp, transport.webp, hotels.webp
//                      one illustration per chapter (left page of each opener)

const BASE = import.meta.env.BASE_URL
/** Path of a file in public/passport/. */
export const passport = (file: string) => `${BASE}passport/${file}`

/** The painting the vignette is cut from. */
export const PAINT_SRC = `${BASE}cerrado/paint.webp`
export const PAINT_ASPECT = 1376 / 768

/** How far the covers overhang the pages (top, bottom, fore-edge), in BOOK units. */
export const COVER_OVERHANG = 7
const PAGE = { w: 682, h: 925 }
/** Room around the boards for the page block's thickness. */
const EDGE = 12

/**
 * The open book, in layout units (scaled to the screen in geometry.ts): two
 * pages meeting at the spine (`split`), each lying on a cover board that
 * overhangs it by COVER_OVERHANG — the inside of the front cover on the
 * left, the back board on the right.
 */
export const BOOK = {
  w: 2 * (EDGE + COVER_OVERHANG + PAGE.w),
  h: 2 * (EDGE + COVER_OVERHANG) + PAGE.h,
  split: EDGE + COVER_OVERHANG + PAGE.w,
  left: { x: EDGE + COVER_OVERHANG, y: EDGE + COVER_OVERHANG, ...PAGE },
  right: { x: EDGE + COVER_OVERHANG + PAGE.w, y: EDGE + COVER_OVERHANG, ...PAGE },
}

/**
 * How the painting sits on the cover — switch here to compare:
 *   'blot'  a free-floating watercolor blot (blot-mask.webp)
 *   'rise'  the landscape rising from the bottom of the cover, flush with
 *           the gold rule at the sides and bottom, a cloud-soft top edge
 *           (blot-mask-2.webp)
 */
export type CoverMask = 'blot' | 'rise'
export const COVER_MASK: CoverMask = 'rise'

/** Width / height of blot-mask.webp. */
export const BLOT_ASPECT = 760 / 483
/**
 * Radius (as a fraction of the mask's height) inside which blot-mask.webp is
 * fully opaque all around its center (measured: 0.405; kept with a margin).
 * Sets how big the mask must start for the blot to cover the whole screen.
 */
const BLOT_CORE = 0.36
/** 'blot': width / height it is drawn at (taller than the file, so it fills more). */
const BLOT_SLOT_ASPECT = 1.22

/**
 * The cover mask in use: its image, and the fraction of its height around
 * its center that is opaque in every direction (for 'rise': its soft top
 * edge reaches down to 0.29 of the height, measured; kept with a margin).
 */
export const MASK = {
  blot: {
    image: `url(${passport('blot-mask.webp')})`,
    core: BLOT_CORE * Math.min(1, BLOT_SLOT_ASPECT / BLOT_ASPECT),
  },
  rise: { image: `url(${passport('blot-mask-2.webp')})`, core: 0.19 },
}[COVER_MASK]

/** 'blot': width / height of the vignette on the cover. */
export const SLOT_ASPECT = BLOT_SLOT_ASPECT

/**
 * cover.webp's inner gold rule, as fractions of the cover: its side and
 * bottom insets, and its corner radius ('rise' sits flush inside it).
 */
export const COVER_RULE = { side: 0.04, bottom: 0.028, radius: 0.03 }

/**
 * The watercolor cathedral, standing on the far hills at the right of the
 * painting: center x, base y and width, as fractions of the painting. The
 * cover's vignette and the shrinking painting both place it with these, so
 * it doesn't move at the hand-over.
 */
export const CATHEDRAL = {
  src: passport('cover-cathedral.webp'),
  aspect: 1000 / 670,
  cx: 0.625,
  base: 0.535,
  w: 0.165,
}

export interface Illustration {
  src: string
  /** CSS background-size / background-position, to crop a larger painting. */
  size: string
  position: string
  /** Cut into the watercolor blot (paintings) or shown as is (cut-outs). */
  blot: boolean
}

export const ASSETS = {
  cover: passport('cover.webp'),
  coverInside: passport('cover-inside.webp'),
  paper: passport('paper.webp'),
  blotMask: MASK.image,
  // One per chapter opener; their soft watercolor edges are in the art.
  illustrations: {
    tourism: { src: passport('tourism.webp'), size: 'contain', position: 'center', blot: false },
    restaurants: {
      src: passport('restaurants.webp'),
      size: 'contain',
      position: 'center',
      blot: false,
    },
    transport: {
      src: passport('transport.webp'),
      size: 'contain',
      position: 'center',
      blot: false,
    },
    hotels: { src: passport('hotels.webp'), size: 'contain', position: 'center', blot: false },
  } satisfies Record<string, Illustration>,
}
