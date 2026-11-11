import type { DeskLayout, PassportGeometry } from '../passport/geometry'

/**
 * The manual shut: width / height. It opens to twice its width — two flaps,
 * each half of it, folded in over the middle panel and meeting at its
 * centre (a gatefold).
 */
export const MANUAL_ASPECT = 0.56

/** Where the shut manual lies on the desk: its centre on screen, size and tilt. */
export interface ManualSpot {
  x: number
  y: number
  w: number
  h: number
  rot: number
  /** Its centre's x once carried off to the right (as the envelope is). */
  offX: number
  /** Held in the hand (a phone upright), not lying on a desk. */
  hand: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * The third thing on the desk, beside the passport and the invitation. On a
 * wide screen it lies over the envelope's lower left, just clear of the
 * passport; on a phone, at the foot of the two cards fanned in the hand.
 */
export function manualOnDesk(g: PassportGeometry, d: DeskLayout): ManualSpot {
  const P = d.passport
  const pw = P.s * g.coverBox.w
  const ph = P.s * g.coverBox.h
  if (d.hand) {
    // Below the fan, its top tucked a little under the two cards' feet.
    const fanFoot = P.y + ph * 0.55
    const h = clamp(g.vh - fanFoot - 14 + ph * 0.16, ph * 0.42, ph * 0.6)
    const w = h * MANUAL_ASPECT
    return {
      x: g.vw / 2 + w * 0.42,
      y: Math.min(fanFoot - ph * 0.16 + h / 2, g.vh - 14 - h / 2),
      w,
      h,
      rot: 6,
      offX: g.vw + w,
      hand: true,
    }
  }
  const E = d.envelope
  const eh = d.env.eh * E.s
  const envFoot = g.vh / 2 + E.y + eh / 2
  const h = ph * 0.62
  const w = h * MANUAL_ASPECT
  // Room under it for its note.
  const y = Math.min(envFoot - h * 0.4, g.vh - h / 2 - Math.max(56, h * 0.17))
  return {
    x: P.x + pw / 2 + w * 0.62,
    y,
    w,
    h,
    rot: -6,
    offX: g.vw + w,
    hand: false,
  }
}
