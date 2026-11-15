import { useEffect, type RefObject } from 'react'

/**
 * Holds the page still behind a popup while `active`: the page can't be
 * scrolled (wheel, keys, a finger), only `panelRef`, the popup's own
 * scrolling box. The scrollbar's room is kept, so nothing shifts.
 */
export function useScrollLock(active: boolean, panelRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return
    const html = document.documentElement
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    const gap = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`
    // iOS Safari can still drag the page under `overflow: hidden`: a
    // one-finger drag outside the popup's box goes nowhere (a pinch still zooms).
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return
      const panel = panelRef?.current
      if (panel && e.target instanceof Node && panel.contains(e.target)) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [active, panelRef])
}
