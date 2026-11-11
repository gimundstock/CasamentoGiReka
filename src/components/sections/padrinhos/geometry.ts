import { NAV_HEIGHT } from '../Envelope'
import { pushPath, type DeskLayout, type PassportGeometry } from '../passport/geometry'

/**
 * The manual shut: width / height. It opens to twice its width — two flaps,
 * each half of it, folded in over the middle panel and meeting at its
 * centre (a gatefold).
 */
export const MANUAL_ASPECT = 0.56

/** Kept clear above the manual (its kicker) and below it (a hint). */
const ROOM = 130
/** Kept clear at the screen's edge, a side panel looked at on a phone. */
const EDGE = 16

/**
 * The manual's size at the centre of a `vw` × `vh` screen: as large as fits
 * with its kicker and hint, and open wide enough to read on a wide screen.
 * `pan` (px) moves the open manual so a side panel is on the screen, where
 * it is wider than the screen (0 where it fits).
 */
export function manualSize(vw: number, vh: number) {
  const h = Math.min(760, vh - NAV_HEIGHT - ROOM, (vw * 0.84) / MANUAL_ASPECT)
  const w = h * MANUAL_ASPECT
  const pan = 2 * w + 2 * EDGE > vw ? w - vw / 2 + EDGE : 0
  return { w, h, pan, y: NAV_HEIGHT + (vh - NAV_HEIGHT) / 2 }
}
export type ManualSize = ReturnType<typeof manualSize>

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Where the shut manual lies on the desk at first, with the passport and
 * the envelope (its centre on screen, height, tilt): on a wide screen over
 * the envelope's lower left, just clear of the passport; on a phone, at
 * the foot of the two cards fanned in the hand.
 */
function lyingOnDesk(g: PassportGeometry, d: DeskLayout) {
  const P = d.passport
  const pw = P.s * g.coverBox.w
  const ph = P.s * g.coverBox.h
  if (d.hand) {
    // Below the fan, its top a little over the two cards' feet.
    const fanFoot = P.y + ph * 0.55
    const h = clamp(g.vh - fanFoot - 14 + ph * 0.16, ph * 0.42, ph * 0.6)
    const w = h * MANUAL_ASPECT
    return {
      x: g.vw / 2 + w * 0.42,
      y: Math.min(fanFoot - ph * 0.16 + h / 2, g.vh - 14 - h / 2),
      h,
      rot: 6,
    }
  }
  const E = d.envelope
  const envFoot = g.vh / 2 + E.y + (d.env.eh * E.s) / 2
  const h = ph * 0.7
  const w = h * MANUAL_ASPECT
  return {
    x: P.x + pw / 2 + w * 0.62,
    y: Math.min(envFoot - h * 0.4, g.vh - h / 2 - 24),
    h,
    rot: -6,
  }
}

/**
 * The manual on the desk: where it lies at first (`lying`), carried off to
 * the right with the envelope as the passport is picked up; and its
 * chapter (CHAPTER) — its size and centre, where it is drawn back in from,
 * and the two pushes: the passport off by the manual, then the manual off
 * by the envelope (as pushPath).
 */
export function manualOnDesk(g: PassportGeometry, d: DeskLayout) {
  const size = manualSize(g.vw, g.vh)
  const offRight = g.vw / 2 + size.w * 0.6 + 80
  const inbound = pushPath(g, size.w, offRight, {})
  const outbound = pushPath(g, d.env.ew, d.pushFrom, { w: size.w, h: size.h, fixed: true })
  return {
    ...size,
    lying: lyingOnDesk(g, d),
    /** Off the right edge, at its size on the desk and at the centre. */
    offRight,
    /** Where it is drawn in from: its centre, px right of the screen's. */
    from: inbound.pushFrom,
    /** The passport's x offset as the manual pushes it (pushedAt). */
    passportPushed: inbound.pushed,
    /** Its own x offset as the envelope pushes it. */
    pushed: outbound.pushed,
  }
}
export type ManualOnDesk = ReturnType<typeof manualOnDesk>
