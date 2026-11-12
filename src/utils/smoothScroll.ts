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

/**
 * Scrolls the window to `targetY` on an ease-in-out curve. A wheel, touch or
 * key from the guest takes over at once. Never call during render (it reads
 * performance.now()).
 */
export function smoothScrollToY(targetY: number, duration?: number) {
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
  const stop = () => {
    cancelAnimationFrame(frame)
    for (const ev of ['wheel', 'touchstart', 'keydown'] as const)
      window.removeEventListener(ev, stop)
    cancelScroll = null
  }
  for (const ev of ['wheel', 'touchstart', 'keydown'] as const)
    window.addEventListener(ev, stop, { passive: true })
  cancelScroll = stop
  function step(now: number) {
    const t = Math.min((now - startTime) / ms, 1)
    // 'instant': the page sets scroll-behavior: smooth, which would otherwise
    // turn every step into a new native smooth scroll fighting this one.
    window.scrollTo({ top: startY + distance * easeInOutSine(t), behavior: 'instant' })
    if (t < 1) frame = requestAnimationFrame(step)
    else stop()
  }
  frame = requestAnimationFrame(step)
}
