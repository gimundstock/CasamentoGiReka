import {
  BOOK,
  CATHEDRAL,
  COVER_OVERHANG,
  COVER_RULE,
  MASK,
  PAINT_ASPECT,
  SLOT_ASPECT,
} from './assets'
import { ENV_CLOSED_Y, envelopeSize, NAV_HEIGHT as ENV_NAV_H } from '../Envelope'

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
  /**
   * From here to the swap the cover's copy is already drawn, all but
   * transparent over the stage painting: shown for the first time at the
   * swap, Safari drew it blank for a frame.
   */
  warm: 65,
  /**
   * The swap itself, a cross-fade: the two copies are resampled differently
   * (their edges differ in sharpness), so cut from one to the other the
   * painting visibly blinked.
   */
  swapFade: [90, 102] as Span,
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
/**
 * Where the Nav "Brasília" link lands: the closed passport, its cover
 * complete, before it opens.
 */
export const PASSPORT_ANCHOR_VH = BIG_DAY_VH + (PHASE.title[1] + PHASE.open[0]) / 2

// ── The desk (wide screens) ──────────────────────────────────────────────
//
// On a wide screen the passport and the invitation lie side by side, as on
// a desk: the painting closes in to the left, where the cover forms around
// it, and the envelope fades in with it on the right, under its edge, with
// wildflowers lying round them.
// Scrolling on picks the passport up — it comes to the
// centre and opens, the envelope leaves — and, once read, it closes, and
// the envelope is drawn back in, pushing it off the screen, to the very spot
// where the invitation (RSVP) takes it over.
//
// The passport's own timeline (PHASE) holds still while the desk is shown
// (`hold`); everything after it runs `hold` later (see passportTime).

export const DESK = {
  /**
   * The passport is carried to its place on the desk while the blot is
   * still bigger than the screen: the painting itself stays put (see
   * vignetteAt), so the blot closes in on the passport's place, and the
   * cover forms there.
   */
  back: [102, 150] as Span,
  /** Picked up: the passport comes to the centre, the envelope leaves. */
  pickUp: [300, 350] as Span,
  /** The passport's timeline stands still across this, at its start. */
  hold: [262, 352] as Span,
  // In the passport's own time (after the hold):
  /** Read: the book closes on the page it is open at. */
  close: [410, 445] as Span,
  /**
   * The envelope is drawn in from the right, to where the invitation takes
   * over, pushing the shut passport off to the left.
   */
  arrive: [444, 500] as Span,
  /** The passport it pushes slides on a little longer, off the screen. */
  shove: [444, 508] as Span,
  /** The kicker and the hint come with it. */
  words: [485, 500] as Span,
  /** End of the stage, in the passport's own time. */
  end: 510,
}
const DESK_HOLD = DESK.hold[1] - DESK.hold[0]

/** Wide enough for the passport and the envelope side by side. */
export function isDesk(vw: number, vh: number) {
  return vw >= 1100 && vw >= vh * 1.25
}

/** vh of scroll the passport takes after the big day. */
export function passportVh(desk: boolean) {
  return desk ? DESK.end + DESK_HOLD : PASSPORT_VH
}

/** Where the Nav "Brasília" link lands: on the desk, both lying there. */
export function passportAnchorVh(desk: boolean) {
  return desk ? BIG_DAY_VH + (DESK.hold[0] + DESK.pickUp[0]) / 2 : PASSPORT_ANCHOR_VH
}

/**
 * The desk's layout: where the shut passport and the envelope lie on it
 * (centres on screen, scale, tilt), and where the envelope ends up — the
 * invitation's own closed envelope, centre relative to the screen's.
 * The envelope is about twice the passport's width, and tucked under its
 * right edge.
 */
export function deskLayout(g: PassportGeometry): DeskLayout {
  let d = desks.get(g)
  if (!d) {
    d = layDesk(g)
    desks.set(g, d)
  }
  return d
}
export type DeskLayout = ReturnType<typeof layDesk>
const desks = new WeakMap<PassportGeometry, DeskLayout>()

function layDesk(g: PassportGeometry) {
  const env = envelopeSize(g.vw, g.vh)
  const cw = g.coverBox.w
  const ch = g.coverBox.h
  /** The shut cover's centre on screen, at rest. */
  const C = { x: g.vw / 2, y: g.cover.y + ch / 2 }
  const ratio = 2
  /** How much of the envelope's width lies under the passport. */
  const under = 0.16
  const fit = (g.vw * 0.84) / (cw * (1 + ratio * (1 - under)))
  const sp = Math.min(0.74, fit, (g.vh * 0.66) / ch)
  const se = (ratio * sp * cw) / env.ew
  const gap = -under * se * env.ew
  const groupW = sp * cw + gap + se * env.ew
  const x0 = (g.vw - groupW) / 2
  const midY = ENV_NAV_H + (g.vh - ENV_NAV_H) / 2
  const offRight = g.vw / 2 + env.ew * 0.6 + 80
  return {
    C,
    env,
    passport: { x: x0 + (sp * cw) / 2, y: midY - g.vh * 0.015, s: sp, rot: -4 },
    envelope: {
      x: x0 + sp * cw + gap + (se * env.ew) / 2 - g.vw / 2,
      y: midY + g.vh * 0.04 - g.vh / 2,
      s: se,
      rot: 5,
    },
    /** The invitation's envelope, shut: centred, a little below the middle. */
    closed: { x: 0, y: ENV_CLOSED_Y },
    /** Off the right edge, at any of its sizes and tilts. */
    offRight,
    /** The push at the end (see pushPath). */
    ...pushPath(g, env.ew, offRight),
  }
}

/**
 * What carries the book to the desk: about `o` (the shut cover's centre at
 * rest), scaled by `s`, turned by `rot` degrees, moved by `d` — the book as
 * laid out (local) → the screen.
 */
export interface Carry {
  o: { x: number; y: number }
  d: { x: number; y: number }
  s: number
  rot: number
}
export const NO_CARRY: Carry = { o: { x: 0, y: 0 }, d: { x: 0, y: 0 }, s: 1, rot: 0 }

/** The carry with the passport `lying` (0 → 1) on the desk. */
export function carryAt(desk: DeskLayout, lying: number): Carry {
  const { C, passport: P } = desk
  return {
    o: C,
    d: { x: (P.x - C.x) * lying, y: (P.y - C.y) * lying },
    s: 1 + (P.s - 1) * lying,
    rot: P.rot * lying,
  }
}

/** A point on the screen, where it is in the carried book's own layout. */
function uncarry(c: Carry, p: { x: number; y: number }) {
  const x = p.x - c.o.x - c.d.x
  const y = p.y - c.o.y - c.d.y
  const a = (-c.rot * Math.PI) / 180
  return {
    x: c.o.x + (x * Math.cos(a) - y * Math.sin(a)) / c.s,
    y: c.o.y + (x * Math.sin(a) + y * Math.cos(a)) / c.s,
  }
}

/** Samples of pushPath across the push. */
const PUSH_STEPS = 240

/**
 * The shut passport pushed off by the envelope, as `dx` (px from its centre
 * position) at PUSH_STEPS + 1 even steps of DESK.shove. The envelope comes in
 * (eased) from `offRight` to the centre; its left edge, reaching a little
 * over the passport, carries the passport along at its own speed, and as
 * the envelope slows the passport slides on by itself, slowing with the
 * friction, until it is off the screen — the most friction that still
 * gets it there, so it never looks thrown.
 */
function pushPath(g: PassportGeometry, ew: number, offRight: number) {
  const half = g.coverBox.w / 2
  const lip = ew * 0.04
  // The envelope's share of the shove (it has arrived when the passport
  // still has a little way to slide).
  const share = (DESK.arrive[1] - DESK.shove[0]) / (DESK.shove[1] - DESK.shove[0])
  let from = offRight
  const edge = (t: number) => from * (1 - ease(Math.min(1, t / share))) - ew / 2 + lip
  // Off the screen with room for its turn.
  const out = -g.vw / 2 - g.coverBox.h * 0.25
  const run = (friction: number) => {
    const xs = [0]
    let r = half
    let speed = 0
    for (let i = 1; i <= PUSH_STEPS; i++) {
      const dt = 1 / PUSH_STEPS
      speed = Math.min(0, speed + friction * dt)
      r += speed * dt
      const l = edge(i * dt)
      if (r > l) {
        speed = Math.min(speed, (l - edge((i - 1) * dt)) / dt)
        r = l
      }
      xs.push(r - half)
    }
    return xs
  }
  const exits = (xs: number[]) => xs[PUSH_STEPS] + half <= out
  // A small envelope on a big screen: drawn in from further off, faster.
  while (!exits(run(0)) && from < 4 * g.vw) from *= 1.1
  let lo = 0
  let hi = 20 * g.vw
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (exits(run(mid))) lo = mid
    else hi = mid
  }
  return {
    /** The passport's x offset (px) at even steps of the shove. */
    pushed: run(lo),
    /** Where the envelope is drawn in from (its centre, px right of the screen's). */
    pushFrom: from,
  }
}

/** The pushed passport's x offset at push progress `t` (0 → 1). */
export function pushedAt(path: number[], t: number) {
  const f = Math.min(1, Math.max(0, t)) * (path.length - 1)
  const i = Math.min(path.length - 2, Math.floor(f))
  return path[i] + (path[i + 1] - path[i]) * (f - i)
}

/** The passport's own time (PHASE) at scroll `v`: still across the desk's hold. */
export function passportTime(v: number, desk: boolean) {
  if (!desk || v <= DESK.hold[0]) return v
  return v < DESK.hold[1] ? DESK.hold[0] : v - DESK_HOLD
}

/**
 * Opacities of the stage painting and of the cover's copy across the swap.
 * Both are drawn at 0.9 and stacked (the cover's on top); the stage's fades
 * so that together they always cover exactly as much as one does — the
 * colour never pulses through the cross-fade.
 */
export function swapOpacities(v: number) {
  const PAINT = 0.9
  const cover = ease(seg(v, PHASE.swapFade))
  const stage = cover >= 1 ? 0 : (1 - cover) / (1 - PAINT * cover)
  return { stage, cover }
}

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
  /** Wide: the passport and the invitation lie side by side first (DESK). */
  desk: boolean
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
  const riseH = coverBox.h * 0.592
  const rise = {
    x: inner.x - inner.w * 0.07,
    y: inner.y + inner.h + riseH * 0.09 - riseH,
    w: inner.w * 1.14,
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

  // The blot stays at the centre of the screen until the cover forms
  // around it (see liftAt). It starts big enough to cover the whole screen.
  const C = { x: cover.x + sc.x, y: vh / 2 }
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
    desk: isDesk(vw, vh),
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

/**
 * How far the closed book is lifted from its resting place at `v`, px: so
 * that the cover's art slot — the blot — sits at the centre of the screen
 * through the whole shrink; the book then settles as the cover forms.
 */
export function liftAt(g: PassportGeometry, v: number) {
  const slotY = g.cover.y + g.slot.y + g.slot.h / 2
  return (g.vh / 2 - slotY) * (1 - ease(seg(v, PHASE.coverGrow)))
}

/** The blot's center on screen: the screen's centre until the cover forms. */
function blotCenter(g: PassportGeometry, v: number) {
  const x = g.cover.x + g.slot.x + g.slot.w / 2
  return { x, y: g.cover.y + g.slot.y + g.slot.h / 2 + liftAt(g, v) }
}

/** The blot's size on screen at `v`, before the bleed: closing in to the slot's size. */
function blotScreen(g: PassportGeometry, v: number) {
  const e = ease(seg(v, PHASE.maskIn))
  const w = g.blotStart.w * Math.pow(g.slot.w / g.blotStart.w, e)
  return { w, h: (w * g.slot.h) / g.slot.w }
}

/**
 * The least and most the stage painting may be slid (negative: up) at `v`
 * so that the closing blot, fixed at the screen's centre, sees painting all
 * round: `lo` keeps the painting's hard bottom edge out of it, `hi` its
 * soft top.
 */
function slideBounds(g: PassportGeometry, v: number) {
  const b = blotScreen(g, v)
  const c = blotCenter(g, v).y
  const top = g.art.y + g.art.h * 0.08
  const bottom = g.art.y + g.art.h
  return { lo: c + b.h * 0.45 - bottom, hi: c - b.h * 0.45 - top }
}

/**
 * As little slide as the blot allows at `v`. While the blot is still taller
 * than the painting allows, only the bottom edge is kept covered (the top is
 * a soft fade into the paper anyway).
 */
function fitSlide(g: PassportGeometry, v: number) {
  const { lo, hi } = slideBounds(g, v)
  return hi >= lo ? Math.max(lo, Math.min(0, hi)) : Math.min(0, lo)
}

/**
 * How far the stage painting is slid up (negative) at `v`. Before the
 * shrink it glides, only ever upwards, to where the shrink needs it — from
 * the moment the blot has closed in enough for it to move without the
 * bottom edge showing: following fitSlide there, it went up and came back
 * down for no visible reason. From the shrink on, fitSlide.
 */
function slideAt(g: PassportGeometry, v: number) {
  if (v >= g.shrinkFrom) return fitSlide(g, v)
  let from = PHASE.swap
  while (from < g.shrinkFrom && slideBounds(g, from).lo > 0) from += 1
  const glide = fitSlide(g, g.shrinkFrom) * ease(seg(v, [from, g.shrinkFrom]))
  return Math.min(0, Math.max(slideBounds(g, v).lo, glide))
}

/** The painting's rect on screen at `v`: from the stage's to the cover's framing. */
function paintingScreen(g: PassportGeometry, v: number): Rect {
  const k = shrinkAt(g, v)
  const P = paintingBox(g)
  const lerp = (a: number, b: number) => a + (b - a) * k
  const lift = liftAt(g, v)
  return {
    x: lerp(g.art.x, g.cover.x + P.x),
    y: lerp(g.art.y + slideAt(g, v), g.cover.y + lift + P.y),
    w: lerp(g.art.w, P.w),
    h: lerp(g.art.h, P.h),
  }
}

/**
 * The frame the vignette is drawn in: the whole screen, in cover
 * coordinates, with room for the book's lift (see liftAt).
 */
export function vignetteBox(g: PassportGeometry): Rect {
  const l = Math.abs(liftAt(g, 0))
  const box = { x: -g.cover.x, y: -g.cover.y - l, w: g.vw, h: g.vh + 2 * l }
  if (!g.desk) return box
  // Carried to the desk (smaller, turned), the frame must still reach the
  // screen's edges: as far as the screen is, in the carried layout.
  const c = carryAt(deskLayout(g), 1)
  let [x0, y0, x1, y1] = [box.x, box.y, box.x + box.w, box.y + box.h]
  for (const [sx, sy] of [
    [0, 0],
    [g.vw, 0],
    [0, g.vh],
    [g.vw, g.vh],
  ]) {
    const p = uncarry(c, { x: sx, y: sy })
    x0 = Math.min(x0, p.x - g.cover.x - 8)
    y0 = Math.min(y0, p.y - g.cover.y - l - 8)
    x1 = Math.max(x1, p.x - g.cover.x + 8)
    y1 = Math.max(y1, p.y - g.cover.y + l + 8)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** How many times the slot the blot window is laid out: its size at the hand-over. */
export function windowScale(g: PassportGeometry) {
  return Math.max(1, blotScreen(g, PHASE.swap).w / g.slot.w)
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
export function vignetteAt(g: PassportGeometry, v: number, carry: Carry = NO_CARRY) {
  const { slot, inner, rise, riseFrom } = g
  const V = vignetteBox(g)
  const C = blotCenter(g, v)
  // Bleed: the blot grows out past the frame; the rise settles into place.
  const m = seg(v, PHASE.bleed)
  const mb = seg(m, [0.2, 1])
  const bleedF = Math.pow(g.bleed, mb * mb)
  const f = (blotScreen(g, v).w / slot.w) * bleedF
  // The painting, in the book's own layout: from where the stage drew it on
  // the screen — wherever the book is carried meanwhile (turned back and
  // scaled up against the carry, so it doesn't move) — to its framing on
  // the cover.
  const P = paintingBox(g)
  const k = shrinkAt(g, v)
  const lift = liftAt(g, v)
  const from = { x: g.art.x, y: g.art.y + slideAt(g, v), w: g.art.w, h: g.art.h }
  const to = { x: g.cover.x + P.x, y: g.cover.y + lift + P.y, w: P.w, h: P.h }
  const c0 = uncarry(carry, { x: from.x + from.w / 2, y: from.y + from.h / 2 })
  const mix = (a: number, b: number) => a + (b - a) * k
  const w = mix(from.w / carry.s, to.w)
  const h = mix(from.h / carry.s, to.h)
  const turn = -carry.rot * (1 - k)
  const a = (turn * Math.PI) / 180
  const cx = mix(c0.x, to.x + to.w / 2)
  const cy = mix(c0.y, to.y + to.h / 2)
  // Its top-left corner (the transform's origin), turned with it.
  const R = {
    x: cx + (-w / 2) * Math.cos(a) - (-h / 2) * Math.sin(a),
    y: cy + (-w / 2) * Math.sin(a) + (-h / 2) * Math.cos(a),
  }
  // In the window's own (unscaled) coordinates.
  const t = {
    x: slot.w / 2 + (R.x - C.x) / f,
    y: slot.h / 2 + (R.y - C.y) / f,
    s: w / f / P.w,
  }
  // The window is laid out windowScale times the slot and scaled DOWN from
  // there: scaled up ×10 from the slot's size, browsers raster it small and
  // magnify, so the painting landed a few px off and soft at the hand-over.
  const F = windowScale(g)
  const paint =
    `translate3d(${(F * t.x - (P.x - slot.x)).toFixed(4)}px, ${(F * t.y - (P.y - slot.y)).toFixed(4)}px, 0)` +
    (turn ? ` rotate(${turn.toFixed(4)}deg)` : '') +
    ` scale(${(F * t.s).toFixed(8)})`

  const mr = ease(seg(m, [0, 0.65]))
  const lerp = (a: number, b: number) => a + (b - a) * mr
  // Both masks are on from the start (applied mid-transition, Safari drew
  // the painting blank for a frame): the rise one as big as the whole frame
  // until the blot has closed in to the slot, from where its start box holds
  // the blot whole — neither cuts anything until the bleed.
  const r =
    v < PHASE.maskIn[1]
      ? riseAround({ x: 0, y: 0, w: V.w, h: V.h })
      : {
          x: lerp(riseFrom.x, rise.x) - V.x,
          y: lerp(riseFrom.y, rise.y) - V.y,
          w: lerp(riseFrom.w, rise.w),
          h: lerp(riseFrom.h, rise.h),
        }
  const px = (n: number) => `${n.toFixed(1)}px`
  const radius = g.coverBox.w * COVER_RULE.radius
  const onCover = shrinkAt(g, v) >= 1
  return {
    window: `scale(${(f / F).toFixed(8)})`,
    scale: f / F,
    shrink: shrinkAt(g, v),
    paint,
    rise: { size: `${px(r.w)} ${px(r.h)}`, position: `${px(r.x)} ${px(r.y)}` },
    clip: onCover
      ? `inset(${px(inner.y - V.y)} ${px(V.x + V.w - inner.x - inner.w)} ` +
        `${px(V.y + V.h - inner.y - inner.h)} ${px(inner.x - V.x)} round ${px(radius)})`
      : 'none',
  }
}
