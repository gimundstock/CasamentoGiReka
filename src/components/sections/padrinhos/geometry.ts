import {
  passportGeometry,
  pushPath,
  type DeskLayout,
  type PassportGeometry,
} from '../passport/geometry'

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
 * Where the shut manual lies on the desk at first: the last of the three
 * (DeskLayout.manual), over the envelope's right end, as big as the
 * passport. Its centre on screen, scale and tilt, and whether it lies over
 * the envelope.
 */
function lyingOnDesk(g: PassportGeometry, d: DeskLayout) {
  // A desk of three (layDesk) has its place; else beside the passport.
  if (d.manual) return { ...d.manual, over: true }
  const P = d.passport
  return { x: P.x + P.s * g.coverBox.w * 0.3, y: P.y, s: P.s, rot: P.rot + 6, over: false }
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

/**
 * The manual drawn in at the end of the invitation (RSVP), pushing its
 * reply card (`cw` × `ch`, centred) off to the left as the envelope pushes
 * the passport (pushPath): its size and place at the centre, where it is
 * drawn in from, and the card's x offset as it goes (pushedAt).
 */
export function manualPushesCard(vw: number, vh: number, cw: number, ch: number) {
  const g = passportGeometry(vw, vh)
  const size = manualSize(g)
  const push = pushPath(g, size.w, vw / 2 + size.w * 0.6 + 80, { w: cw, h: ch })
  return { size, from: push.pushFrom, pushed: push.pushed }
}
export type ManualPush = ReturnType<typeof manualPushesCard>
