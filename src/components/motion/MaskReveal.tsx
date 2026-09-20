import { useEffect, useRef, type ReactNode } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'framer-motion'
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

/** Which inset side starts at 100 %, as [top, right, bottom, left]. */
const HIDDEN_SIDES: Record<Direction, [number, number, number, number]> = {
  up: [100, 0, 0, 0],
  down: [0, 0, 100, 0],
  left: [0, 0, 0, 100],
  right: [0, 100, 0, 0],
}

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

interface TimelineMaskProps {
  children: ReactNode
  direction: Direction
  className?: string
  duration: number
  delay: number
  amount: number
  /** `undefined` → play once the element scrolls into view. */
  play?: boolean
}

/**
 * Timeline-driven mask, used for both the in-view and the gated (`play`)
 * modes.
 *
 * The clip-path goes on an INNER element while the in-view observer watches an
 * unclipped OUTER wrapper. Chrome folds an element's own clip-path into the
 * rect it reports to IntersectionObserver, so observing the clipped element
 * deadlocks: it is hidden because it never comes into view, and it never comes
 * into view because being hidden gives it zero area. That is what left every
 * section heading and the CityGuide tab bar permanently invisible. The
 * scroll-driven `ScrollMask` below was unaffected — it never observes anything.
 */
function TimelineMask({
  children,
  direction,
  className,
  duration,
  delay,
  amount,
  play,
}: TimelineMaskProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount })
  const active = play ?? inView

  const progress = useMotionValue(0)
  useEffect(() => {
    const controls = animate(progress, active ? 1 : 0, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
  }, [active, progress, duration, delay])

  const [t, r, b, l] = HIDDEN_SIDES[direction]
  const top = useTransform(progress, [0, 1], [t, 0])
  const right = useTransform(progress, [0, 1], [r, 0])
  const bottom = useTransform(progress, [0, 1], [b, 0])
  const left = useTransform(progress, [0, 1], [l, 0])
  const clipPath = useMotionTemplate`inset(${top}% ${right}% ${bottom}% ${left}%)`

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ clipPath }}>{children}</motion.div>
    </div>
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
  // play === undefined → play once the element scrolls into view.
  return (
    <TimelineMask
      direction={direction}
      className={className}
      duration={duration}
      delay={delay}
      amount={amount}
      play={play}
    >
      {children}
    </TimelineMask>
  )
}
