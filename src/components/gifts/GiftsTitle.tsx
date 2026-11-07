import { useEffect, useState } from 'react'
import { motion, type MotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NAV_HEIGHT } from '../sections/Envelope'

function useScreenHeight() {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return h
}

/** Where the title's middle comes to rest once it has risen, from the top. */
export const GIFTS_TITLE_TOP = NAV_HEIGHT + 72

/**
 * The gift list's kicker and title, centred on a screen. Drawn by the RSVP
 * as its reply card leaves and, in the very same place, by the gift list's
 * first screen, which lies over the RSVP's last one — so the hand-over
 * between the two can't be seen. The list then raises the title (`y`, an
 * offset from the middle) and shrinks it (`scale`) into its header.
 */
export function GiftsTitle({
  opacity = 1,
  y = 0,
  scale = 1,
  hidden,
}: {
  opacity?: number | MotionValue<number>
  y?: number | MotionValue<number>
  scale?: number | MotionValue<number>
  hidden?: boolean
}) {
  const { t } = useTranslation()
  const h = useScreenHeight()
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
      <motion.div className="absolute inset-x-0 h-0" style={{ top: h / 2, y, scale }}>
        <h2 className="font-display text-title -translate-y-1/2 px-4 text-center text-4xl leading-[1.35] md:text-5xl">
          {t('gifts.title')}
        </h2>
      </motion.div>
    </motion.div>
  )
}
