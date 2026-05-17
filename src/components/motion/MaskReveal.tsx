import type { ReactNode } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

type Direction = 'up' | 'down' | 'left' | 'right'

interface Props {
  children: ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  className?: string
  amount?: number
  /**
   * When provided, the reveal becomes scroll-driven: the clip-path
   * interpolates from hidden to revealed as scrollProgress goes from
   * `scrollStart` to `scrollEnd`.
   */
  scrollProgress?: MotionValue<number>
  /** Scroll progress at which the reveal starts (0–1). Default 0. */
  scrollStart?: number
  /** Scroll progress at which the reveal completes (0–1). Default 0.5. */
  scrollEnd?: number
  /**
   * Gates the timeline-based reveal. `false` keeps it hidden, `true` plays
   * the reveal once, `undefined` falls back to whileInView auto-play.
   */
  play?: boolean
}

const INITIAL: Record<Direction, string> = {
  up: 'inset(100% 0% 0% 0%)',
  down: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 0% 0% 100%)',
  right: 'inset(0% 100% 0% 0%)',
}

const REVEALED = 'inset(0% 0% 0% 0%)'

interface ScrollMaskProps {
  children: ReactNode
  direction: Direction
  className?: string
  scrollProgress: MotionValue<number>
  scrollStart: number
  scrollEnd: number
}

function ScrollMask({
  children,
  direction,
  className,
  scrollProgress,
  scrollStart,
  scrollEnd,
}: ScrollMaskProps) {
  const clipPath = useTransform(
    scrollProgress,
    [scrollStart, scrollEnd],
    [INITIAL[direction], REVEALED]
  )

  return (
    <motion.div className={className} style={{ clipPath }}>
      {children}
    </motion.div>
  )
}

/**
 * Editorial mask reveal. A solid block sweeps off children — useful for
 * text blocks and images that should feel "unveiled" rather than faded.
 *
 * Pass `scrollProgress` (from `useScroll`) to drive the reveal from scroll
 * position instead of playing on mount.
 */
export function MaskReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 1.4,
  className,
  amount = 0.3,
  scrollProgress,
  scrollStart = 0,
  scrollEnd = 0.5,
  play,
}: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  if (scrollProgress) {
    return (
      <ScrollMask
        direction={direction}
        className={className}
        scrollProgress={scrollProgress}
        scrollStart={scrollStart}
        scrollEnd={scrollEnd}
      >
        {children}
      </ScrollMask>
    )
  }

  // play === false → stay hidden. play === true → play the reveal.
  // play === undefined → fall back to whileInView auto-play.
  if (play !== undefined) {
    return (
      <motion.div
        className={className}
        initial={{ clipPath: INITIAL[direction] }}
        animate={{ clipPath: play ? REVEALED : INITIAL[direction] }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: INITIAL[direction] }}
      whileInView={{ clipPath: REVEALED }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}
