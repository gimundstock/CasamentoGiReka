import { pushPath, type DeskLayout, type PassportGeometry } from '../passport/geometry'

/** Kept clear at the screen's edge, a page looked at on a phone. */
const EDGE = 16

/**
 * The manual at the centre of the screen: the passport's cover exactly
 * (size, corners, and its place there, shut). `pan` (px) moves it, open,
 * so one page is on the screen, where the two are wider than the screen
 * (0 where they fit).
 */
export function manualSize(g: PassportGeometry) {
  const w = g.coverBox.w
  const h = g.coverBox.h
  const pan = 2 * w + 2 * EDGE > g.vw ? w - g.vw / 2 + EDGE : 0
  return { w, h, pan, radius: g.radius, y: g.cover.y + h / 2 }
}

/**
 * Where the shut manual lies on the desk at first: behind the passport, as
 * big as it is — a second thing in the pile, peeking out to its right (on
 * a phone, a third card in the hand, between the passport and the
 * envelope). Its centre on screen, scale and tilt.
 */
function lyingOnDesk(g: PassportGeometry, d: DeskLayout) {
  const P = d.passport
  const pw = P.s * g.coverBox.w
  const ph = P.s * g.coverBox.h
  if (d.hand) {
    return {
      x: (P.x + g.vw / 2 + d.envelope.x) / 2,
      y: P.y - ph * 0.03,
      s: P.s,
      rot: 0,
    }
  }
  return { x: P.x + pw * 0.24, y: P.y - ph * 0.04, s: P.s, rot: P.rot + 7 }
}

/**
 * The manual on the desk: where it lies at first (`lying`), carried off to
 * the right with the envelope as the passport is picked up; and its
 * chapter (CHAPTER) — its size and centre, where it is drawn back in from,
 * and the two pushes: the passport off by the manual, then the manual off
 * by the envelope (as pushPath).
 */
export function manualOnDesk(g: PassportGeometry, d: DeskLayout) {
  const size = manualSize(g)
  const offRight = g.vw / 2 + size.w * 0.6 + 80
  const inbound = pushPath(g, size.w, offRight, {})
  const outbound = pushPath(g, d.env.ew, d.pushFrom, { w: size.w, h: size.h, fixed: true })
  return {
    ...size,
    lying: lyingOnDesk(g, d),
    /** Off the right edge. */
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
