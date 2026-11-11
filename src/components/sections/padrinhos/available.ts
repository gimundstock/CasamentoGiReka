import { useEffect, useState } from 'react'
import { CONFIG } from '../../../content.config'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { isDesk } from '../passport/geometry'

/**
 * Whether the manual is out: once the couple publish it, or always in
 * `npm run dev` (so the draft can be seen before its content is in).
 */
export const manualPublished = () => CONFIG.padrinhos.published || import.meta.env.DEV

/**
 * Whether the passport's desk scene is shown (wide screens, phones upright,
 * motion allowed), where the manual lies on the desk. Elsewhere it is
 * offered on the welcome screen instead.
 */
export function useDeskScene() {
  const reduced = useReducedMotion()
  const [desk, setDesk] = useState(() => isDesk(window.innerWidth, window.innerHeight))
  useEffect(() => {
    const onResize = () => setDesk(isDesk(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return desk && !reduced
}
