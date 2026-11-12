import { useEffect, type RefObject } from 'react'
import { isAutoScrolling, smoothScrollToY } from '../../../utils/smoothScroll'

/** How long the scroll must be still to count as come to rest, ms (as the passport's). */
const SETTLE_MS = 180
/** How far towards the next rest a stop must be to be carried on to it. */
const COMMIT = 0.2

/** A stretch the scroll may stay in, [from, to], and where it is taken to. */
export interface Rest {
  from: number
  to: number
  aim: number
}

/** Where to settle at `v`, moving `dir`, between `rests` (in order); null to stay. */
export function restTarget(v: number, dir: 1 | -1, rests: Rest[]): number | null {
  for (let i = 0; i < rests.length - 1; i++) {
    const a = rests[i]
    const b = rests[i + 1]
    if (v <= a.to || v >= b.from) continue
    const f = (v - a.to) / (b.from - a.to)
    return (dir > 0 ? f > COMMIT : f > 1 - COMMIT) ? b.aim : a.aim
  }
  return null
}

/**
 * The passport's snap (usePassportSnap) for a pinned section of its own:
 * once the scroll comes to rest between two of `rests` (vh scrolled since
 * the section's top reached the screen's), it is carried on to one.
 */
export function useRestSnap(
  trackRef: RefObject<HTMLElement | null>,
  rests: Rest[],
  enabled: boolean
) {
  const key = JSON.stringify(rests)
  useEffect(() => {
    if (!enabled) return
    const list: Rest[] = JSON.parse(key)
    let lastY = window.scrollY
    let dir: 1 | -1 = 1
    let timer = 0
    let touching = false
    const settle = () => {
      const el = trackRef.current
      if (!el || touching || isAutoScrolling()) return
      const top = window.scrollY + el.getBoundingClientRect().top
      const vh = window.innerHeight / 100
      const v = (window.scrollY - top) / vh
      const target = restTarget(v, dir, list)
      if (target === null) return
      const y = top + target * vh
      const dist = Math.abs(y - window.scrollY)
      if (dist >= 2) smoothScrollToY(y, Math.min(900, 350 + dist * 0.6), true)
    }
    const later = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, SETTLE_MS)
    }
    const onScroll = () => {
      const y = window.scrollY
      if (y !== lastY && !isAutoScrolling()) dir = y > lastY ? 1 : -1
      lastY = y
      later()
    }
    const onTouchStart = () => {
      touching = true
      window.clearTimeout(timer)
    }
    const onTouchEnd = () => {
      touching = false
      later()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    // A trackpad's momentum: still coming, even where the page can't move.
    window.addEventListener('wheel', later, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', later)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [trackRef, key, enabled])
}
