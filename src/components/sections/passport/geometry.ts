import {
  BOOK,
  CATHEDRAL,
  COVER_OVERHANG,
  COVER_RULE,
  MASK,
  PAINT_ASPECT,
  SLOT_ASPECT,
} from './assets'

// ── Scroll timeline ──────────────────────────────────────────────────────
//
// HeroBigDay's sticky stage scrolls for BIG_DAY_VH (the sun's journey, as
// before) and then PASSPORT_VH more, in which the finished painting becomes
// the passport. Phases below are in vh of scroll AFTER the big day ends
// (0 = the info panel has been fully shown for a moment).

export const BIG_DAY_VH = 300
export const PASSPORT_VH = 410

type Span = readonly [number, number]
export const PHASE = {
  /** Date / venue / title, the sun and its haze leave the painting. */
  infoOut: [35, 60] as Span,
  /** The pencil lines fade, leaving the watercolor alone. */
  linesOut: [40, 85] as Span,
  /**
   * The still, finished painting is swapped for the cover's own copy of it,
   * pixel for pixel in the same place: from here on ONE element carries the
   * painting into the cover.
   */
  swap: 90,
  /** The blot closes in from beyond the screen edges. */
  maskIn: [95, 165] as Span,
  /** The painting shrinks and drifts to the cover's art slot. */
  shrink: [125, 188] as Span,
  /** The watercolor cathedral is painted in, once the blot is small. */
  cathedral: [180, 192] as Span,
  /** The cover fades in behind the vignette, at its full size. */
  coverGrow: [185, 230] as Span,
  /** On the cover, the blot bleeds out into the rise shape. */
  bleed: [190, 260] as Span,
  /** Title and star settle onto the cover. */
  title: [220, 260] as Span,
  /** The cover turns over to the left; the book slides to center. */
  open: [290, 370] as Span,
}
/** Where the Nav "Brasília" link lands: the book just fully open. */
export const PASSPORT_ANCHOR_VH = BIG_DAY_VH + PHASE.open[1] + 8

/** 0 → 1 across a span, clamped. */
export function seg(v: number, [a, b]: Span): number {
  return v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a)
}

/** Slow in, slow out — breath-like. */
export function ease(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// ── Layout ───────────────────────────────────────────────────────────────

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface PassportGeometry {
  vw: number
  vh: number
  /** Two pages side by side (true), or one page at a time (phones). */
  spread: boolean
  /** Scale of the book on screen (px per BOOK unit). */
  k: number
  /** The book image's box, open layout: whole spread, or its right half on phones. */
  book: Rect
  /** Where the image splits into its two halves, in book px (spread only). */
  split: number
  /** Page areas in book coordinates (`left` is unused on phones). */
  left: Rect
  right: Rect
  page: { w: number; h: number }
  /** The cover leaf, in book coordinates: the right page plus a little overhang. */
  coverBox: Rect
  /** Where the cover lies once turned open (its mirror across the hinge). */
  insideBox: Rect
  /** Book translateX while closed, so the cover alone is centered. */
  closedShift: number
  /** Closed cover's top-left on screen. */
  cover: { x: number; y: number }
  /** The blot's box on the cover (where the painting shrinks to), in cover coordinates. */
  slot: Rect
  /** Inside the cover's gold rule, in cover coordinates: the painting's frame. */
  inner: Rect
  /** The 'rise' shape the blot bleeds out into, in cover coordinates. */
  rise: Rect
  /** The 'rise' mask's box at the start of the bleed: big enough to hold the whole blot. */
  riseFrom: Rect
  /** How much the blot grows by the end of the bleed, to cover the whole frame. */
  bleed: number
  /** The painting's box on screen, at rest (HeroBigDay's artBox). */
  art: Rect
  /** How far the painting reaches past the screen's left, right and bottom. */
  over: { l: number; r: number; b: number }
  /** Point of the painting that ends up at the slot's center. */
  focal: { x: number; y: number }
  /** Final scale of the painting. */
  scale: number
  /** Blot size in the painting's own (unscaled) coordinates, at the end. */
  blotLocal: { w: number; h: number }
  /** Blot size at the start, so its core covers the whole screen. */
  blotStart: { w: number; h: number }
  /** Base font size of a page (everything inside is in em). */
  fontSize: number
  /** Corner radius of the cover (cover.webp's rounded corners), px. */
  radius: number
  /** How far the cover overhangs the pages, px. */
  overhang: number
  /**
   * Scroll (vh) at which the painting may start shrinking: once the closing
   * blot fits inside the painting, so the painting's straight edges never
   * come into view.
   */
  shrinkFrom: number
}

const NAV_H = 72
const CONTROLS_H = 56
/** cover.webp's corner radius, as a fraction of its width (measured: 54 / 989). */
const COVER_CORNER = 0.055
/** How far the active tab sticks out past the book's edge. */
export const TAB_OUT = 30

const scaleRect = (r: Rect, k: number, dx = 0): Rect => ({
  x: (r.x - dx) * k,
  y: r.y * k,
  w: r.w * k,
  h: r.h * k,
})

export function passportGeometry(vw: number, vh: number): PassportGeometry {
  // Same box as HeroBigDay's artVars (--art-top is 44vh below md, 14vh above).
  const artTop = vw >= 768 ? 0.14 * vh : 0.44 * vh
  const artW = Math.max(vw, (vh - artTop) * PAINT_ASPECT)
  const artH = artW / PAINT_ASPECT
  const artLeft = Math.max(vw - artW, Math.min(vw / 2 - artW * 0.3, 0))
  const art = { x: artLeft, y: artTop, w: artW, h: artH }

  // Book size: the open spread as big as fits under the nav, with room for
  // the tabs and the page controls. Phones get its right half only.
  const availH = vh - NAV_H - CONTROLS_H - 12
  const maxH = Math.min(availH, 0.8 * vh, 860)
  // Two pages unless they'd be cramped (phones), or one page would be far
  // bigger (tall portrait tablets, where the spread is width-bound).
  const kSpread = Math.min(maxH / BOOK.h, (vw - 2 * TAB_OUT - 40) / BOOK.w)
  const kSingle = Math.min(maxH / BOOK.h, (vw - TAB_OUT - 22) / (BOOK.w - BOOK.split))
  const spread = BOOK.right.w * kSpread >= 300 && kSingle < kSpread * 1.4
  const k = spread ? kSpread : kSingle
  const dx = spread ? 0 : BOOK.split
  const bookW = (BOOK.w - dx) * k
  const bookH = BOOK.h * k
  const bookX = spread ? (vw - bookW) / 2 : (vw - bookW - TAB_OUT + 4) / 2
  const bookY = NAV_H + Math.max(0, (availH - bookH) / 2)
  const left = scaleRect(BOOK.left, k, dx)
  const right = scaleRect(BOOK.right, k, dx)
  const o = COVER_OVERHANG * k
  const coverBox = { x: right.x, y: right.y - o, w: right.w + o, h: right.h + 2 * o }
  const insideBox = { ...coverBox, x: coverBox.x - coverBox.w }
  const coverX = bookX + coverBox.x
  // Closed, the cover is centred on screen (so is the blot shrinking into it).
  const closedShift = vw / 2 - (coverX + coverBox.w / 2)
  const cover = { x: coverX + closedShift, y: bookY + coverBox.y }

  const pageW = right.w
  const pageH = right.h
  // The blot: ~85 % of the cover inside its gold rule and half its height,
  // under the title. It then bleeds out into `rise`: flush inside the rule
  // at the sides and bottom, up to a little under the title.
  const sw = coverBox.w * 0.85
  const sh = sw / SLOT_ASPECT
  const slot = { x: coverBox.w * 0.5 - sw / 2, y: coverBox.h * 0.6 - sh / 2, w: sw, h: sh }
  const slotW = slot.w
  const slotH = slot.h
  const slotAspect = slotW / slotH
  const inner = {
    x: coverBox.w * COVER_RULE.side,
    y: coverBox.h * COVER_RULE.top,
    w: coverBox.w * (1 - 2 * COVER_RULE.side),
    h: coverBox.h * (1 - COVER_RULE.top - COVER_RULE.bottom),
  }
  // The rise shape reaches a little past the frame at the sides and bottom
  // (the mask's own edge pixels are soft): clipped to the frame's rounded
  // rect, the paint meets the gold rule exactly.
  const riseH = coverBox.h * 0.555
  const rise = {
    x: inner.x - inner.w * 0.03,
    y: inner.y + inner.h + riseH * 0.03 - riseH,
    w: inner.w * 1.06,
    h: riseH,
  }
  // Start of the bleed: a rise box whose opaque part (below its soft top)
  // holds the whole blot, so at first only the blot shows.
  const riseFrom = riseAround(slot)
  // By the end the growing blot covers the whole frame.
  const sc = { x: slot.x + slotW / 2, y: slot.y + slotH / 2 }
  const reach = Math.max(
    Math.hypot(sc.x - inner.x, sc.y - inner.y),
    Math.hypot(inner.x + inner.w - sc.x, sc.y - inner.y),
    Math.hypot(sc.x - inner.x, inner.y + inner.h - sc.y),
    Math.hypot(inner.x + inner.w - sc.x, inner.y + inner.h - sc.y)
  )
  const bleed = (reach / (MASK.blot.core * slotH)) * 1.1

  // The painting's scale on the cover: the blot shows half its width — or
  // more zoom if needed, so that it still fills the whole rise shape once
  // the blot has bled out (the painting itself never moves on the cover).
  const scaleFor = (fx: number, fy: number) => {
    const need = Math.max(
      (sc.y - rise.y) / (fy - artTop),
      (rise.y + rise.h - sc.y) / (artTop + artH - fy),
      (sc.x - rise.x) / (fx - artLeft),
      (rise.x + rise.w - sc.x) / (artLeft + artW - fx)
    )
    return Math.min(0.95, Math.max(slotW / (artW * 0.5), need * 1.02))
  }
  const focal = { x: artLeft + artW * 0.47, y: artTop + artH * 0.56 }
  let scale = scaleFor(focal.x, focal.y)
  // Framing, so the cathedral reads on the finished cover: inside the frame
  // at the right, and its cross well below the rise's cloudy top, with clear
  // sky above it. (A few rounds: the zoom depends on the framing.)
  const cathRight = artLeft + artW * (CATHEDRAL.cx + CATHEDRAL.w / 2)
  const cathTop = artTop + artH * (CATHEDRAL.base - (CATHEDRAL.w * PAINT_ASPECT) / CATHEDRAL.aspect)
  const crossAt = rise.y + rise.h * (MASK.rise.top + 0.07)
  for (let i = 0; i < 4; i++) {
    focal.x = Math.max(focal.x, cathRight - (slotW * 0.4) / scale)
    // …but the blot, while shrinking, must stay inside the painting: its
    // straight top edge must never show.
    focal.y = Math.max(cathTop - (crossAt - sc.y) / scale, artTop + (slotH * 0.56) / scale)
    scale = scaleFor(focal.x, focal.y)
  }
  const blotLocal = { w: slotW / scale, h: slotH / scale }

  // The blot is centred mid-screen horizontally throughout. Vertically it
  // starts in the lower middle of the stage's painting and glides to where
  // the cover's art slot is. It starts big enough to cover the whole screen.
  const C = { x: cover.x + sc.x, y: artTop + artH * BLOT_START_Y }
  const far = Math.max(
    Math.hypot(C.x, C.y),
    Math.hypot(vw - C.x, C.y),
    Math.hypot(C.x, vh - C.y),
    Math.hypot(vw - C.x, vh - C.y)
  )
  const startH = (far / MASK.blot.core) * 1.08
  const blotStart = { w: startH * slotAspect, h: startH }

  const g: PassportGeometry = {
    vw,
    vh,
    spread,
    k,
    book: { x: bookX, y: bookY, w: bookW, h: bookH },
    split: (BOOK.split - dx) * k,
    left,
    right,
    page: { w: pageW, h: pageH },
    coverBox,
    insideBox,
    closedShift,
    cover,
    slot,
    inner,
    rise,
    riseFrom,
    bleed,
    art,
    over: {
      l: Math.ceil(Math.max(0, -artLeft)),
      r: Math.ceil(Math.max(0, artLeft + artW - vw)),
      b: Math.ceil(Math.max(0, artTop + artH - vh)),
    },
    focal,
    scale,
    blotLocal,
    blotStart,
    fontSize: Math.max(12.5, Math.min(15, pageW * 0.027)),
    shrinkFrom: PHASE.shrink[0],
    radius: coverBox.w * COVER_CORNER,
    overhang: o,
  }
  // The first scroll position from which the painting may start moving:
  // from there on, the closing blot stays inside the moving painting all
  // the way (its outer tenth is soft, so it may overhang that much), so the
  // painting's straight edges never show.
  const fitsFrom = (x0: number) => {
    const g0 = { ...g, shrinkFrom: x0 }
    for (let v = x0; v <= PHASE.shrink[1]; v += 1) {
      const b = blotScreen(g0, v)
      const r = paintingScreen(g0, v)
      const c = blotCenter(g0, v)
      // The painting's top tenth is its soft sky fade: keep clear of it too.
      const top = r.y + r.h * 0.1
      const ok =
        b.w * 0.45 <= Math.min(c.x - r.x, r.x + r.w - c.x) &&
        b.h * 0.45 <= Math.min(c.y - top, r.y + r.h - c.y)
      if (!ok) return false
    }
    return true
  }
  for (let x = PHASE.shrink[0]; x <= PHASE.shrink[1] - 20; x += 1) {
    g.shrinkFrom = x
    if (fitsFrom(x)) break
  }
  return g
}

/** The painting's box on the finished cover, in cover coordinates. */
export function paintingBox(g: PassportGeometry): Rect {
  const { slot, art, focal, scale } = g
  return {
    x: slot.x + slot.w / 2 + (art.x - focal.x) * scale,
    y: slot.y + slot.h / 2 + (art.y - focal.y) * scale,
    w: art.w * scale,
    h: art.h * scale,
  }
}

/**
 * A 'rise' mask box whose opaque part (below its soft top) holds the whole
 * of `r` with a little margin — so intersected with it, nothing of `r` is cut.
 */
export function riseAround(r: Rect): Rect {
  const m = r.h * 0.04
  const h = (r.h + 2 * m) / (1 - MASK.rise.top)
  return { x: r.x - m, y: r.y - m - MASK.rise.top * h, w: r.w + 2 * m, h }
}

/** Shrink progress at `v`: 0 = the painting as on the stage, 1 = on the cover. */
function shrinkAt(g: PassportGeometry, v: number) {
  return ease(seg(v, [Math.min(g.shrinkFrom, PHASE.shrink[1] - 20), PHASE.shrink[1]]))
}

/** The blot's center on screen: fixed, where the cover's art slot will be. */
function blotCenter(g: PassportGeometry, v: number) {
  const end = { x: g.cover.x + g.slot.x + g.slot.w / 2, y: g.cover.y + g.slot.y + g.slot.h / 2 }
  const start = g.art.y + g.art.h * BLOT_START_Y
  // It glides up together with the painting's own move onto the cover.
  const ky = shrinkAt(g, v)
  return { x: end.x, y: start + (end.y - start) * ky }
}

/** Where (down the stage's painting) the blot is centred as it starts closing in. */
const BLOT_START_Y = 0.56

/** The blot's size on screen at `v`, before the bleed: closing in to the slot's size. */
function blotScreen(g: PassportGeometry, v: number) {
  const e = ease(seg(v, PHASE.maskIn))
  const w = g.blotStart.w * Math.pow(g.slot.w / g.blotStart.w, e)
  return { w, h: (w * g.slot.h) / g.slot.w }
}

/** The painting's rect on screen at `v`: from the stage's to the cover's framing. */
function paintingScreen(g: PassportGeometry, v: number): Rect {
  const k = shrinkAt(g, v)
  const P = paintingBox(g)
  const lerp = (a: number, b: number) => a + (b - a) * k
  return {
    x: lerp(g.art.x, g.cover.x + P.x),
    y: lerp(g.art.y, g.cover.y + P.y),
    w: lerp(g.art.w, P.w),
    h: lerp(g.art.h, P.h),
  }
}

/** The frame the vignette is drawn in: the whole screen, in cover coordinates. */
export function vignetteBox(g: PassportGeometry): Rect {
  return { x: -g.cover.x, y: -g.cover.y, w: g.vw, h: g.vh }
}

/**
 * The cover vignette at scroll `v` (vh past the big day) — the ONE painting
 * from the swap until the book opens. Three nested elements:
 *
 * - the frame (`vignetteBox`, the whole screen): clipped to the gold rule's
 *   rounded rect once the painting is on the cover, and carrying the
 *   'rise' mask during the bleed;
 * - the blot window: a box the size of the cover's art slot, CENTRED where
 *   the slot is (mid-screen), with a static blot mask; it only scales —
 *   from covering the whole screen down to the slot, then out again as the
 *   paint bleeds to the cover's edges;
 * - the painting inside it, which pans and scales from where the stage drew
 *   it to its framing on the cover (counter to the window's scale).
 *
 * Masks intersect by nesting (WebKit has no reliable mask-composite).
 */
export function vignetteAt(g: PassportGeometry, v: number) {
  const { slot, inner, rise, riseFrom } = g
  const V = vignetteBox(g)
  const C = blotCenter(g, v)
  const Cend = blotCenter(g, PHASE.shrink[1])
  // Bleed: the blot grows out past the frame; the rise settles into place.
  const m = seg(v, PHASE.bleed)
  const mb = seg(m, [0.2, 1])
  const bleedF = Math.pow(g.bleed, mb * mb)
  const f = (blotScreen(g, v).w / slot.w) * bleedF
  // The painting, in the window's own (unscaled) coordinates.
  const R = paintingScreen(g, v)
  const t = {
    x: slot.w / 2 + (R.x - C.x) / f,
    y: slot.h / 2 + (R.y - C.y) / f,
    s: R.w / f / paintingBox(g).w,
  }
  const P = paintingBox(g)
  const paint = `translate3d(${(t.x - (P.x - slot.x)).toFixed(2)}px, ${(t.y - (P.y - slot.y)).toFixed(2)}px, 0) scale(${t.s.toFixed(5)})`

  const mr = ease(seg(m, [0, 0.65]))
  const lerp = (a: number, b: number) => a + (b - a) * mr
  const r = {
    x: lerp(riseFrom.x, rise.x) - V.x,
    y: lerp(riseFrom.y, rise.y) - V.y,
    w: lerp(riseFrom.w, rise.w),
    h: lerp(riseFrom.h, rise.h),
  }
  const px = (n: number) => `${n.toFixed(1)}px`
  const radius = g.coverBox.w * COVER_RULE.radius
  const onCover = shrinkAt(g, v) >= 1
  return {
    window: `translate3d(0, ${(C.y - Cend.y).toFixed(2)}px, 0) scale(${f.toFixed(5)})`,
    paint,
    blotMasked: v >= PHASE.maskIn[0],
    riseMasked: m > 0,
    rise: { size: `${px(r.w)} ${px(r.h)}`, position: `${px(r.x)} ${px(r.y)}` },
    clip: onCover
      ? `inset(${px(inner.y - V.y)} ${px(V.x + V.w - inner.x - inner.w)} ` +
        `${px(V.y + V.h - inner.y - inner.h)} ${px(inner.x - V.x)} round ${px(radius)})`
      : 'none',
  }
}
