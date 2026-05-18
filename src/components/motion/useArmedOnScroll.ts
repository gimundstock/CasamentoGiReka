import { useEffect, useState } from 'react'

/**
 * Latch on the user's first scroll past a small threshold. Once armed,
 * stays armed — useful for triggering hero entrance animations the moment
 * the user starts engaging with the page, so the animation can then play
 * out on its own timeline regardless of further scrolling.
 */
export function useArmedOnScroll(threshold = 20): boolean {
  const [armed, setArmed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.scrollY > threshold
  })

  useEffect(() => {
    if (armed) return
    function onScroll() {
      if (window.scrollY > threshold) {
        setArmed(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [armed, threshold])

  return armed
}
