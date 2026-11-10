import { useEffect, type RefObject } from 'react'
import { isAutoScrolling, smoothScrollToY } from '../../../utils/smoothScroll'
import { PASSPORT_START_VH, snapTarget } from './geometry'

/**
 * How long the scroll must be still to count as come to rest, ms. Long
 * enough to see through a trackpad's or a phone's momentum, whose events
 * keep coming until it has run out.
 */
const SETTLE_MS = 180

/**
 * Carries the scroll on to the passport's nearest resting state (shut, open
 * or, on the desk, the envelope drawn in) once it comes to rest part-way
 * between two — see snapTarget. It never fights the guest: a finger still
 * on the screen holds it off, and a wheel, touch or key takes over at once
 * (smoothScrollToY).
 *
 * `stageRef` is HeroBigDay's pinned stage, `lockedRef` its pinned length in
 * vh: the same mapping from scroll to the passport's time as its own.
 */
export function usePassportSnap(
  stageRef: RefObject<HTMLDivElement | null>,
  lockedRef: { readonly current: number },
  desk: boolean,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return
    let lastY = window.scrollY
    let dir: 1 | -1 = 1
    let timer = 0
    let touching = false

    const settle = () => {
      const el = stageRef.current
      if (!el || touching || isAutoScrolling()) return
      const locked = lockedRef.current
      const top = window.scrollY + el.getBoundingClientRect().top
      // As useScroll measures it: from the stage's top at the screen's top
      // to its bottom at the screen's bottom.
      const span = el.offsetHeight - window.innerHeight
      if (span <= 0) return
      const p = (window.scrollY - top) / span
      if (p <= 0 || p >= 1) return
      const target = snapTarget(p * locked - PASSPORT_START_VH, dir, desk)
      if (target === null) return
      const y = top + ((target + PASSPORT_START_VH) / locked) * span
      const dist = Math.abs(y - window.scrollY)
      if (dist < 2) return
      // Quicker than the Nav's jumps: a short glide into place.
      smoothScrollToY(y, Math.min(900, 350 + dist * 0.6))
    }
    const later = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, SETTLE_MS)
    }
    const onScroll = () => {
      const y = window.scrollY
      // The guest's direction, not the glide's.
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
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [stageRef, lockedRef, desk, enabled])
}
