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

/**
 * The manual's chapter on the desk (CHAPTER): its size and centre, where it
 * is drawn in from, and the two pushes — the passport off by the manual,
 * then the manual off by the envelope (as pushPath).
 */
export function manualOnDesk(g: PassportGeometry, d: DeskLayout) {
  const size = manualSize(g.vw, g.vh)
  const offRight = g.vw / 2 + size.w * 0.6 + 80
  const inbound = pushPath(g, size.w, offRight, {})
  const outbound = pushPath(g, d.env.ew, d.pushFrom, { w: size.w, h: size.h, fixed: true })
  return {
    ...size,
    /** Where it is drawn in from: its centre, px right of the screen's. */
    from: inbound.pushFrom,
    /** The passport's x offset as the manual pushes it (pushedAt). */
    passportPushed: inbound.pushed,
    /** Its own x offset as the envelope pushes it. */
    pushed: outbound.pushed,
  }
}
export type ManualOnDesk = ReturnType<typeof manualOnDesk>
