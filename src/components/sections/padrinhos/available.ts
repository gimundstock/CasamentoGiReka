import { createContext } from 'react'
import { CONFIG } from '../../../content.config'
import { isHand, type Chapter } from '../passport/geometry'

/** Who the manual is made out to (the guest's padrinhos, by name), for its cover. */
export const PadrinhoNames = createContext<string[]>([])

/**
 * Whether the manual is out: once the couple publish it, or always in
 * `npm run dev` (so the draft can be seen before its content is in).
 */
export const manualPublished = () => CONFIG.padrinhos.published || import.meta.env.DEV

/** The manual's chapter on the desk, if it has one there (see CHAPTER). */
export function manualChapter(
  padrinho: boolean | undefined,
  desk: boolean,
  reduced: boolean,
  vw: number,
  vh: number
): Chapter {
  if (!padrinho || !manualPublished() || !desk || reduced) return false
  return isHand(vw, vh) ? 'hand' : 'desk'
}

/**
 * Whether the manual has a section of its own: where it has no chapter on
 * the desk (a tablet, a phone on its side, reduced motion).
 */
export function manualSection(padrinho: boolean | undefined, chapter: Chapter) {
  return !!padrinho && manualPublished() && !chapter
}
