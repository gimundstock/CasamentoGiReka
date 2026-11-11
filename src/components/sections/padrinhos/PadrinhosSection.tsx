import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMotionValueEvent, useScroll } from 'framer-motion'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { ScrollHint } from '../../ui/ScrollHint'
import { ease, isDesk, seg } from '../passport/geometry'
import { manualChapter, manualSection } from './available'
import { Gatefold, type GatefoldHandle } from './Gatefold'
import { manualSize } from './geometry'
import { useRestSnap, type Rest } from './useRestSnap'

/**
 * The section's timeline, vh scrolled since its top reached the screen's.
 * The manual lies shut as it comes, unfolds, and lies open; on a phone,
 * where it is wider than the screen open, it is looked along a panel at a
 * time (the left one as it unfolds). Then the page goes on, the manual open.
 */
const T = {
  unfold: [30, 90] as const,
  toMiddle: [110, 138] as const,
  toRight: [160, 188] as const,
  /** Pinned this long: open (desk), or at the right panel (phone). */
  end: { desk: 170, hand: 210 },
}
const point = (v: number): Rest => ({ from: v, to: v, aim: v })

function useScreen() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () =>
      setSize((prev) =>
        // (A phone's toolbar showing or hiding is not a new layout.)
        prev.w === window.innerWidth ? prev : { w: window.innerWidth, h: window.innerHeight }
      )
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/**
 * The padrinhos' manual as a section of its own (`padrinhos.mode: 'secao'`,
 * or where there is no desk scene for it): pinned while the scroll unfolds
 * it, on the invitation's paper. Padrinhos only.
 */
export function PadrinhosSection({ padrinho }: { padrinho?: boolean }) {
  const { w: vw, h: vh } = useScreen()
  const reduced = useReducedMotion()
  const chapter = manualChapter(padrinho, isDesk(vw, vh), reduced, vw, vh)
  if (!manualSection(padrinho, chapter)) return null
  return <Section vw={vw} vh={vh} reduced={reduced} />
}

function Section({ vw, vh, reduced }: { vw: number; vh: number; reduced: boolean }) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLElement>(null)
  const foldRef = useRef<GatefoldHandle>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const openHintRef = useRef<HTMLDivElement>(null)
  const size = manualSize(vw, vh)
  const { w, h, pan } = size
  const phone = pan > 0
  const end = phone ? T.end.hand : T.end.desk
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })

  const update = (p: number) => {
    const s = p * end
    const opened = reduced ? 1 : ease(seg(s, T.unfold))
    foldRef.current?.set(opened)
    if (panRef.current && phone && !reduced) {
      const at = opened - ease(seg(s, T.toMiddle)) - ease(seg(s, T.toRight))
      panRef.current.style.transform = `translate3d(${(pan * at).toFixed(2)}px, 0, 0)`
    }
    const hint = openHintRef.current
    if (hint) hint.style.opacity = String(1 - seg(s, [T.unfold[0], T.unfold[0] + 12]))
  }
  useMotionValueEvent(scrollYProgress, 'change', update)
  useLayoutEffect(() => update(scrollYProgress.get()))

  const rests: Rest[] = phone
    ? [
        point(0),
        point((T.unfold[1] + T.toMiddle[0]) / 2),
        point((T.toMiddle[1] + T.toRight[0]) / 2),
        point(end),
      ]
    : [point(0), point(end)]
  useRestSnap(trackRef, rests, !reduced)

  // Reduced motion: the manual simply lies open (on a phone, scrolled along
  // by hand).
  const card = (
    <div ref={panRef} style={{ width: 2 * w }}>
      <Gatefold w={w} h={h} handle={foldRef} />
    </div>
  )
  return (
    <section
      ref={trackRef}
      id="padrinhos"
      aria-label={t('padrinhos.label')}
      className="bg-peach bg-paper relative"
      style={{ height: reduced ? '100svh' : `${end + 100}vh` }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <p
          className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
          style={{ top: size.y - h / 2 - 40 }}
        >
          {t('padrinhos.kicker')}
        </p>
        {reduced && phone ? (
          <div
            className="absolute inset-x-0 overflow-x-auto [scrollbar-width:none]"
            style={{ top: size.y - h / 2, height: h, scrollSnapType: 'x mandatory' }}
          >
            <div className="px-4" style={{ width: 2 * w + 32, scrollSnapAlign: 'start' }}>
              {card}
            </div>
          </div>
        ) : (
          <div className="absolute" style={{ left: vw / 2 - w, top: size.y - h / 2 }}>
            {card}
          </div>
        )}
        {!reduced && vh - (size.y + h / 2) >= 40 && (
          <div
            ref={openHintRef}
            aria-hidden
            className="absolute inset-x-0 text-center"
            style={{ top: size.y + h / 2 + 18 }}
          >
            <ScrollHint label={t('padrinhos.hintOpen')} />
          </div>
        )}
      </div>
    </section>
  )
}
