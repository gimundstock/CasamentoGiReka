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

/**
 * The gift list's kicker and title, centred on a screen. Drawn by the RSVP
 * as its reply card leaves and, in the very same place, by the gift list's
 * first screen, which lies over the RSVP's last one — so the hand-over
 * between the two can't be seen.
 */
export function GiftsTitle({
  opacity = 1,
  hidden,
}: {
  opacity?: number | MotionValue<number>
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
      <h2
        className="font-display text-title absolute inset-x-0 -translate-y-1/2 px-4 text-center text-4xl leading-[1.35] md:text-5xl"
        style={{ top: h / 2 }}
      >
        {t('gifts.title')}
      </h2>
    </motion.div>
  )
}
