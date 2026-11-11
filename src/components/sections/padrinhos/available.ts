import { CONFIG } from '../../../content.config'
import { isHand, type Chapter } from '../passport/geometry'

/**
 * Whether the manual is out: once the couple publish it, or always in
 * `npm run dev` (so the draft can be seen before its content is in).
 */
export const manualPublished = () => CONFIG.padrinhos.published || import.meta.env.DEV

/**
 * Where the manual is shown: 'mesa', a chapter of the passport's desk
 * scene; 'secao', a section of its own after the gift list. While the two
 * are compared, `?manual=mesa` or `?manual=secao` in the URL picks one.
 */
export type ManualMode = 'mesa' | 'secao'
export function manualMode(): ManualMode {
  const q = new URLSearchParams(window.location.search).get('manual')
  return q === 'mesa' || q === 'secao' ? q : CONFIG.padrinhos.mode
}

/** The manual's chapter on the desk, if it has one there (see CHAPTER). */
export function manualChapter(
  padrinho: boolean | undefined,
  desk: boolean,
  reduced: boolean,
  vw: number,
  vh: number
): Chapter {
  if (!padrinho || !manualPublished() || manualMode() !== 'mesa' || !desk || reduced) return false
  return isHand(vw, vh) ? 'hand' : 'desk'
}

/**
 * Whether the manual has a section of its own: always in 'secao'; in
 * 'mesa', where there is no desk scene (a tablet, a phone on its side,
 * reduced motion).
 */
export function manualSection(padrinho: boolean | undefined, chapter: Chapter) {
  if (!padrinho || !manualPublished()) return false
  return manualMode() === 'secao' || !chapter
}
