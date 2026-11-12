import { useEffect, useState } from 'react'
import { CONFIG } from '../../../content.config'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { isDesk, isHand, type Chapter } from '../passport/geometry'

/**
 * Whether the manual is out: once the couple publish it, or always in
 * `npm run dev` (so the draft can be seen before its content is in).
 */
export const manualPublished = () => CONFIG.padrinhos.published || import.meta.env.DEV

/** Whether the manual lies on the passport's desk (behind the passport). */
export function manualLies(padrinho: boolean | undefined, desk: boolean, reduced: boolean) {
  return !!padrinho && manualPublished() && desk && !reduced
}

/**
 * The manual's chapter on the desk, if it is opened there, after the
 * passport (`opensAfter: 'passport'`; see CHAPTER).
 */
export function manualChapter(
  padrinho: boolean | undefined,
  desk: boolean,
  reduced: boolean,
  vw: number,
  vh: number
): Chapter {
  if (CONFIG.padrinhos.opensAfter !== 'passport' || !manualLies(padrinho, desk, reduced)) {
    return false
  }
  return isHand(vw, vh) ? 'hand' : 'desk'
}

/**
 * Whether the manual has a section of its own, after the invitation: when
 * it opens there (`opensAfter: 'invitation'`), or where it has no chapter
 * on the desk (a tablet, a phone on its side, reduced motion).
 */
export function useManualSection(padrinho: boolean | undefined) {
  const reduced = useReducedMotion()
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const { w, h } = size
  return !!padrinho && manualPublished() && !manualChapter(padrinho, isDesk(w, h), reduced, w, h)
}
