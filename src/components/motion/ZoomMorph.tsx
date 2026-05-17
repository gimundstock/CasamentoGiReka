import type { ReactNode, CSSProperties } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** Scroll progress driving the morph. */
  scrollProgress: MotionValue<number>
  /** When the morph starts (0–1). */
  scrollStart: number
  /** When the morph completes (0–1). */
  scrollEnd: number
  /** Starting scale. Default 1. */
  scaleFrom?: number
  /** Ending scale. Default 12. */
  scaleTo?: number
  /** Starting opacity. Default 1. */
  opacityFrom?: number
  /** Ending opacity. Default 1. */
  opacityTo?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}

interface ScrollMorphProps {
  scrollProgress: MotionValue<number>
  scrollStart: number
  scrollEnd: number
  scaleFrom: number
  scaleTo: number
  opacityFrom: number
  opacityTo: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}

function ScrollMorph({
  scrollProgress,
  scrollStart,
  scrollEnd,
  scaleFrom,
  scaleTo,
  opacityFrom,
  opacityTo,
  children,
  className,
  style,
}: ScrollMorphProps) {
  const scale = useTransform(scrollProgress, [scrollStart, scrollEnd], [scaleFrom, scaleTo])
  const opacity = useTransform(scrollProgress, [scrollStart, scrollEnd], [opacityFrom, opacityTo])

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className ?? ''}`}
      style={{ ...style, scale, opacity }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Scroll-driven zoom morph. Scales (and optionally fades) its child as
 * `scrollProgress` traverses `[scrollStart, scrollEnd]`, creating a
 * "morph" transition where the child grows to fill — and overflow — the
 * viewport. The wrapper is `absolute inset-0` with `overflow: visible`;
 * the parent stage should be `overflow-hidden` to crop the visible area.
 *
 * Values clamp outside the sub-range. Respects `prefers-reduced-motion`
 * by rendering children statically at `scaleFrom` / `opacityFrom`.
 */
export function ZoomMorph({
  scrollProgress,
  scrollStart,
  scrollEnd,
  scaleFrom = 1,
  scaleTo = 12,
  opacityFrom = 1,
  opacityTo = 1,
  children,
  className,
  style,
}: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className ?? ''}`}
        style={{ ...style, transform: `scale(${scaleFrom})`, opacity: opacityFrom }}
      >
        {children}
      </div>
    )
  }

  return (
    <ScrollMorph
      scrollProgress={scrollProgress}
      scrollStart={scrollStart}
      scrollEnd={scrollEnd}
      scaleFrom={scaleFrom}
      scaleTo={scaleTo}
      opacityFrom={opacityFrom}
      opacityTo={opacityTo}
      className={className}
      style={style}
    >
      {children}
    </ScrollMorph>
  )
}
