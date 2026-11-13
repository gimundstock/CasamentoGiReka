import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NAV_HEIGHT } from '../sections/Envelope'

/** The screen's height, live (on iOS it changes as the address bar comes and goes). */
function useScreenHeight() {
  const h = useMotionValue(window.innerHeight)
  useEffect(() => {
    const onResize = () => h.set(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [h])
  return h
}

const NOT_RISEN = { get: () => 0 } as MotionValue<number>

/** Where the title's middle comes to rest once it has risen, from the top. */
export const GIFTS_TITLE_TOP = NAV_HEIGHT + 86

/**
 * The gift list's kicker and title, centred on a screen. Drawn by the RSVP
 * as its reply card leaves and, in the very same place, by the gift list's
 * first screen, which lies over the RSVP's last one — so the hand-over
 * between the two can't be seen. The list then raises the title (`rise`,
 * 0 → 1: from the middle up to GIFTS_TITLE_TOP) and shrinks it (`scale`)
 * into its header. Both ends from the screen's height as it is now, so the
 * title can't drift when it changes mid-scroll (iOS's address bar).
 */
export function GiftsTitle({
  opacity = 1,
  rise,
  scale = 1,
  hidden,
}: {
  opacity?: number | MotionValue<number>
  rise?: MotionValue<number>
  scale?: number | MotionValue<number>
  hidden?: boolean
}) {
  const { t } = useTranslation()
  const h = useScreenHeight()
  const top = useTransform(() => {
    const v = (rise ?? NOT_RISEN).get()
    return (h.get() / 2) * (1 - v) + GIFTS_TITLE_TOP * v
  })
  return (
    <motion.div
      aria-hidden={hidden}
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      <p
        className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
        style={{ top: NAV_HEIGHT + 32 }}
      >
        {t('nav.gifts')}
      </p>
      <motion.div className="absolute inset-x-0 h-0" style={{ top, scale }}>
        <h2 className="font-display text-title -translate-y-1/2 px-4 text-center text-4xl leading-[1.35] md:text-5xl">
          {t('gifts.title')}
        </h2>
      </motion.div>
    </motion.div>
  )
}
