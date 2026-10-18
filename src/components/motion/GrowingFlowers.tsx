import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** The wildflower strip (transparent background). */
  src: string
  /** Page color behind the strip; the reveal veil is painted in it. */
  background: string
  /** Seconds to wait before it starts growing. Default 0.4. */
  delay?: number
  /** Seconds the growth takes. Default 3.2. */
  duration?: number
  className?: string
}

const GROW_EASE: [number, number, number, number] = [0.3, 0.7, 0.3, 1]

// The veil is the strip's height of solid page color plus a feathered edge
// of this much (× strip height) under it.
const SOFT = 0.5
const VEIL_HEIGHT = 1 + SOFT

/**
 * A strip of wildflowers that grows up out of the ground: the whole field
 * stretches upward from its base while a soft edge in the page color rises
 * past it, uncovering the plants from the bottom to the top (stems first,
 * heads last). Only transform and opacity are animated.
 */
export function GrowingFlowers({ src, background, delay = 0.4, duration = 3.2, className }: Props) {
  const reduced = useReducedMotion()
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (reduced) return
    const id = window.setTimeout(() => setFinished(true), (delay + duration) * 1000 + 100)
    return () => window.clearTimeout(id)
  }, [reduced, delay, duration])

  const imgClass =
    'absolute inset-0 h-full w-full max-w-none object-cover object-bottom select-none'

  if (reduced) {
    return (
      <div aria-hidden className={className}>
        <img src={src} alt="" draggable={false} className={imgClass} />
      </div>
    )
  }

  return (
    <div aria-hidden className={`${className ?? ''} overflow-hidden`}>
      <motion.img
        src={src}
        alt=""
        draggable={false}
        className={imgClass}
        style={{ transformOrigin: '50% 100%', willChange: 'transform, opacity' }}
        initial={{ scaleY: 0.45, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{
          delay,
          scaleY: { duration, ease: GROW_EASE },
          opacity: { duration: duration * 0.25, ease: 'easeOut', delay },
        }}
      />
      {!finished && (
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{
            height: `${VEIL_HEIGHT * 100}%`,
            background: `linear-gradient(to bottom, ${background} 0%, ${background} ${
              (1 / VEIL_HEIGHT) * 100
            }%, transparent 100%)`,
            willChange: 'transform',
          }}
          initial={{ y: '0%' }}
          animate={{ y: '-100%' }}
          transition={{ delay, duration, ease: GROW_EASE }}
        />
      )}
    </div>
  )
}
