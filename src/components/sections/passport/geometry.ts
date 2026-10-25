import { BOOK, PAINT_ASPECT, SLOT_ASPECT, SLOT_CORE } from './assets'

// ── Scroll timeline ──────────────────────────────────────────────────────
//
// HeroBigDay's sticky stage scrolls for BIG_DAY_VH (the sun's journey, as
// before) and then PASSPORT_VH more, in which the finished painting becomes
// the passport. Phases below are in vh of scroll AFTER the big day ends
// (0 = the info panel has been fully shown for a moment).

export const BIG_DAY_VH = 300
export const PASSPORT_VH = 380

type Span = readonly [number, number]
export const PHASE = {
  /** Date / venue / title, the sun and its haze leave the painting. */
  infoOut: [35, 60] as Span,
  /** The pencil lines fade, leaving the watercolor alone. */
  linesOut: [50, 120] as Span,
  /** The blot closes in from beyond the screen edges. */
  maskIn: [60, 140] as Span,
  /** The painting shrinks and drifts to the cover's art slot. */
  shrink: [75, 150] as Span,
  /**
   * Still: the cover's own copy of the vignette fades in over the painting,
   * then takes over (it draws the image, not the canvas, so tones differ a hair).
   */
  handoff: [150, 160] as Span,
  /** The cream cover grows out around the vignette. */
  coverGrow: [160, 215] as Span,
  /** Title, star and sketch settle onto the cover. */
  title: [195, 240] as Span,
  /** The cover turns over to the left; the book slides to center. */
  open: [260, 340] as Span,
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
  /** Book translateX while closed, so the cover alone is centered. */
  closedShift: number
  /** Closed cover's top-left on screen (it covers the right page exactly). */
  cover: { x: number; y: number }
  /** The blot's box on the cover, in cover coordinates. */
  slot: Rect
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
}

const NAV_H = 72
const CONTROLS_H = 56
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
  const coverX = bookX + right.x
  const closedShift = spread ? vw / 2 - (coverX + right.w / 2) : 0
  const cover = { x: coverX + closedShift, y: bookY + right.y }

  const pageW = right.w
  const pageH = right.h
  // The blot spans ~90 % of the cover inside its gold rule, and over half
  // its height, under the title.
  const slotW = pageW * 0.87
  const slotH = slotW / SLOT_ASPECT
  const slot = { x: pageW * 0.5 - slotW / 2, y: pageH * 0.64 - slotH / 2, w: slotW, h: slotH }

  const focal = { x: artLeft + artW * 0.47, y: artTop + artH * 0.56 }
  const blotLocalW = artW * 0.5
  const scale = Math.min(0.9, slotW / blotLocalW)
  const blotLocal = { w: slotW / scale, h: slotH / scale }

  const far = Math.max(
    Math.hypot(focal.x, focal.y),
    Math.hypot(vw - focal.x, focal.y),
    Math.hypot(focal.x, vh - focal.y),
    Math.hypot(vw - focal.x, vh - focal.y)
  )
  const startH = (far / SLOT_CORE) * 1.08
  const blotStart = { w: startH * SLOT_ASPECT, h: startH }

  return {
    vw,
    vh,
    spread,
    k,
    book: { x: bookX, y: bookY, w: bookW, h: bookH },
    split: (BOOK.split - dx) * k,
    left,
    right,
    page: { w: pageW, h: pageH },
    closedShift,
    cover,
    slot,
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
  }
}

/** The painting's transform at shrink progress k (0 → 1), in screen px. */
export function paintingTransform(g: PassportGeometry, k: number) {
  const sx = g.cover.x + g.slot.x + g.slot.w / 2
  const sy = g.cover.y + g.slot.y + g.slot.h / 2
  return {
    x: (sx - g.focal.x) * k,
    y: (sy - g.focal.y) * k,
    scale: 1 + (g.scale - 1) * k,
  }
}

/** Blot size at mask progress m: shrinks geometrically, so it feels even. */
export function blotSize(g: PassportGeometry, m: number) {
  const w = g.blotStart.w * Math.pow(g.blotLocal.w / g.blotStart.w, m)
  return { w, h: w / SLOT_ASPECT }
}
