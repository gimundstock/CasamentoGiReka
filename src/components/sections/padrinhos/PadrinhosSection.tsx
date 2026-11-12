import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { ScrollHint } from '../../ui/ScrollHint'
import { GiftsTitle } from '../../gifts/GiftsTitle'
import { NAV_HEIGHT } from '../Envelope'
import { DeskFlowers } from '../passport/DeskFlowers'
import { deskLayout, ease, isDesk, isHand, passportGeometry, seg } from '../passport/geometry'
import { ManualCard, type ManualCardHandle } from './ManualCard'
import { manualSize } from './geometry'
import { useRestSnap, type Rest } from './useRestSnap'

/**
 * The section's timeline, vh scrolled since its top reached the screen's.
 * It starts with the manual shut at the centre, where it came to rest
 * pushing the reply card off (ManualArriving, in the RSVP); it opens as the
 * passport does, lies open (on a phone, a page at a time), and shuts.
 * Then, over the last screen (`end` on), it rises off the desk as the reply
 * card would have, and the gift list's title comes in its place (the list
 * lies over that screen).
 */
const T = {
  shut: 0,
  open: [24, 84] as const,
  /** A phone: from the left page to the right one. */
  toRight: [114, 144] as const,
  close: [176, 216] as const,
  end: 224,
}
/** The hand-over to the gift list: one screen. */
const LEAVE = 100
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
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
 * The padrinhos' manual, opened once the invitation has been answered —
 * it comes for the reply card, pushing it off — between the RSVP and the
 * gift list (padrinhos only; see
 * useManualSection). On the same desk as the two: its first screen lies
 * over the RSVP's last one, and the gift list's over its own last one, as
 * the two lay over each other before.
 */
export function PadrinhosSection() {
  const { t } = useTranslation()
  const { w: vw, h: vh } = useScreen()
  const reduced = useReducedMotion()
  const trackRef = useRef<HTMLElement>(null)
  // The scene and its hand-over (the section but its last screen, which
  // the gift list lies over).
  const timelineRef = useRef<HTMLDivElement>(null)
  const moverRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const foldRef = useRef<ManualCardHandle>(null)
  const openHintRef = useRef<HTMLDivElement>(null)
  const onHintRef = useRef<HTMLDivElement>(null)
  const kickerRef = useRef<HTMLParagraphElement>(null)
  const g = useMemo(() => passportGeometry(vw, vh), [vw, vh])
  const size = manualSize(g)
  const { w, h, y, pan } = size
  // The desk's wildflowers, where the RSVP leaves them (not on a phone).
  const deskGeo = !reduced && isDesk(vw, vh) && !isHand(vw, vh) ? g : null

  // Shown once its top reaches the screen's (the RSVP's copy of the desk
  // is under it till then), until it has left the screen.
  const { scrollYProgress: arrival } = useScroll({
    target: trackRef,
    offset: ['start end', 'start start'],
  })
  const { scrollYProgress: gone } = useScroll({
    target: trackRef,
    offset: ['end end', 'end start'],
  })
  const shown = useTransform(() => (arrival.get() >= 0.999 && gone.get() < 1 ? 1 : 0))
  const events = useTransform(shown, (o) => (o ? 'auto' : 'none'))
  // The scene, 0 → 1 over T.end vh from its top reaching the screen's; the
  // hand-over over the screen after it.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start start', 'end end'],
  })
  const { scrollYProgress: leavingP } = useScroll({
    target: timelineRef,
    offset: ['end end', 'end start'],
  })

  const update = (p: number) => {
    const s = p * T.end
    const mover = moverRef.current
    if (!mover) return
    // The hand-over: as the reply card left (see RSVP).
    const leaving = leavingP.get()
    const rise = -ease(clamp01(leaving / 0.7)) * vh * 0.8
    mover.style.transform = `translate3d(0, ${rise.toFixed(2)}px, 0)`
    mover.style.opacity = String(1 - clamp01((leaving - 0.15) / 0.45))
    const opened = ease(seg(s, T.open))
    const closed = ease(seg(s, T.close))
    foldRef.current?.set(opened * (1 - closed))
    if (panRef.current && pan) {
      const at = opened - 2 * ease(seg(s, T.toRight)) + closed
      panRef.current.style.transform = `translate3d(${(pan * at).toFixed(2)}px, 0, 0)`
    }
    const fade = (el: HTMLElement | null, o: number) => {
      if (el) el.style.opacity = String(o)
    }
    // The kicker comes with the manual, and goes as it rises.
    // (In after the hand-over from the RSVP, which has neither.)
    fade(kickerRef.current, ease(seg(s, [0, 16])) * (1 - clamp01(leaving / 0.25)))
    fade(openHintRef.current, ease(seg(s, [0, 12])) * (1 - seg(s, [T.open[0], T.open[0] + 12])))
    fade(
      onHintRef.current,
      seg(s, [T.open[1] - 12, T.open[1]]) * (1 - seg(s, [T.close[0], T.close[0] + 12]))
    )
  }
  useMotionValueEvent(scrollYProgress, 'change', update)
  useMotionValueEvent(leavingP, 'change', () => update(scrollYProgress.get()))
  useLayoutEffect(() => {
    if (reduced) foldRef.current?.set(1)
    else update(scrollYProgress.get())
  })
  const giftsTitle = useTransform(leavingP, (v) => clamp01((v - 0.3) / 0.55))

  const openMid = (T.open[1] + T.close[0]) / 2
  const rests: Rest[] = pan
    ? [
        point(T.shut),
        point((T.open[1] + T.toRight[0]) / 2),
        point((T.toRight[1] + T.close[0]) / 2),
        point(T.end),
      ]
    : [point(T.shut), { from: T.open[1] + 12, to: T.close[0] - 12, aim: openMid }, point(T.end)]
  useRestSnap(trackRef, rests, !reduced)

  const card = (
    <div ref={panRef} style={{ width: 2 * w }}>
      <ManualCard w={w} h={h} radius={size.radius} handle={foldRef} />
    </div>
  )

  if (reduced) {
    // No scene: the manual simply lies open (on a phone, scrolled along by
    // hand).
    return (
      <section
        id="padrinhos"
        aria-label={t('padrinhos.label')}
        className="bg-peach bg-paper relative flex h-[100svh] items-center overflow-x-auto"
      >
        <div className="mx-auto px-4">{card}</div>
      </section>
    )
  }

  return (
    <motion.section
      ref={trackRef}
      id="padrinhos"
      aria-label={t('padrinhos.label')}
      className="relative"
      style={{
        // Its first screen over the RSVP's last; the gift list's first over
        // its own last (GiftsDesk).
        height: `${T.end + LEAVE + 100}vh`,
        marginTop: '-100vh',
        zIndex: 42,
      }}
    >
      <div
        ref={timelineRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: `${T.end + LEAVE}vh` }}
      />
      <motion.div
        className="bg-peach bg-paper fixed inset-x-0 top-0 h-[100svh] overflow-hidden"
        style={{ opacity: shown, pointerEvents: events }}
      >
        {deskGeo && (
          <div aria-hidden className="pointer-events-none fixed inset-0">
            <DeskFlowers g={deskGeo} desk={deskLayout(deskGeo, true)} />
          </div>
        )}
        <div
          ref={moverRef}
          className="absolute"
          style={{ left: vw / 2 - w, top: y - h / 2, width: 2 * w, height: h }}
        >
          {card}
          {vh - (y + h / 2) >= 40 && (
            <>
              <div
                ref={openHintRef}
                aria-hidden
                className="absolute inset-x-0 text-center"
                style={{ top: h + 18, opacity: 0 }}
              >
                <ScrollHint label={t('padrinhos.hintOpen')} />
              </div>
              <div
                ref={onHintRef}
                aria-hidden
                className="absolute inset-x-0 text-center"
                style={{ top: h + 18, opacity: 0 }}
              >
                <ScrollHint label={t('city.passport.hintScroll')} />
              </div>
            </>
          )}
        </div>
        {y - h / 2 - NAV_HEIGHT >= 56 && (
          <p
            ref={kickerRef}
            aria-hidden
            className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
            style={{ top: NAV_HEIGHT + 32, opacity: 0 }}
          >
            {t('padrinhos.kicker')}
          </p>
        )}
        <div aria-hidden className="pointer-events-none fixed inset-0">
          <GiftsTitle opacity={giftsTitle} hidden />
        </div>
      </motion.div>
    </motion.section>
  )
}
