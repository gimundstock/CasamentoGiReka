/** Gentle ease-in-out: starts slow, speeds up without rushing, lands slow. */
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/**
 * Long jumps get more time than short ones so the sections don't fly past,
 * within bounds: ~0.8s for a hop, up to 2.2s from the top to the gifts.
 */
const scrollDuration = (distance: number) =>
  Math.min(2200, Math.max(800, 500 + Math.sqrt(Math.abs(distance)) * 12))

let cancelScroll: (() => void) | null = null

/** Whether a smoothScrollToY is under way (its own scroll events are not the guest's). */
export const isAutoScrolling = () => cancelScroll !== null

/** A wheel event this long after the last one starts a new gesture (not momentum). */
const NEW_GESTURE_MS = 120
/** A wheel step this large is the guest's own, not a momentum tail. */
const FIRM_DELTA = 40

/**
 * Scrolls the window to `targetY` on an ease-in-out curve. A wheel, touch or
 * key from the guest takes over at once. Never call during render (it reads
 * performance.now()).
 *
 * `snap`: a glide into place once the guest has let go (the passport's
 * snap). A trackpad (or a Magic Mouse) keeps sending wheel events for a
 * while after the fingers lift — momentum — which would otherwise cancel
 * the glide part-way and scroll against it: those are swallowed. A new
 * gesture (after a pause), a firm wheel step, a touch or a key still take
 * over at once.
 */
export function smoothScrollToY(targetY: number, duration?: number, snap = false) {
  cancelScroll?.()
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 1) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: targetY, behavior: 'instant' })
    return
  }
  const ms = duration ?? scrollDuration(distance)
  const startTime = performance.now()
  let frame = 0
  let lastWheel = performance.now()
  /** Landed, still swallowing what momentum is left (snap only). */
  let landed = false
  let tailTimer = 0
  const isMomentum = (e: WheelEvent) =>
    performance.now() - lastWheel < NEW_GESTURE_MS && Math.abs(e.deltaY) < FIRM_DELTA
  const onWheel = (e: WheelEvent) => {
    const momentum = isMomentum(e)
    lastWheel = performance.now()
    if (snap && momentum) {
      e.preventDefault()
      // Landed: let go once the momentum has run out.
      if (landed) {
        window.clearTimeout(tailTimer)
        tailTimer = window.setTimeout(release, NEW_GESTURE_MS)
      }
    } else if (landed) release()
    else stop()
  }
  const release = () => {
    window.clearTimeout(tailTimer)
    window.removeEventListener('wheel', onWheel)
  }
  const stop = () => {
    cancelAnimationFrame(frame)
    release()
    for (const ev of ['touchstart', 'keydown'] as const) window.removeEventListener(ev, stop)
    cancelScroll = null
  }
  // (Not passive: a momentum step is swallowed, so it doesn't scroll
  // against the glide.)
  window.addEventListener('wheel', onWheel, { passive: false })
  for (const ev of ['touchstart', 'keydown'] as const)
    window.addEventListener(ev, stop, { passive: true })
  cancelScroll = stop
  function step(now: number) {
    const t = Math.min((now - startTime) / ms, 1)
    // 'instant': the page sets scroll-behavior: smooth, which would otherwise
    // turn every step into a new native smooth scroll fighting this one.
    window.scrollTo({ top: startY + distance * easeInOutSine(t), behavior: 'instant' })
    if (t < 1) frame = requestAnimationFrame(step)
    else if (snap) {
      // In place: done gliding, but momentum still arriving is swallowed a
      // moment longer, so it can't carry the page off again.
      for (const ev of ['touchstart', 'keydown'] as const) window.removeEventListener(ev, stop)
      cancelScroll = null
      landed = true
      tailTimer = window.setTimeout(release, NEW_GESTURE_MS)
    } else stop()
  }
  frame = requestAnimationFrame(step)
}
