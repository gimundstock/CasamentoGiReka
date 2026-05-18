import type { ReactNode, CSSProperties } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** Scroll progress driving the rise. */
  scrollProgress: MotionValue<number>
  /** When the card starts rising into view (0–1). */
  scrollStart: number
  /** When the card has fully risen past the top (0–1). */
  scrollEnd: number
  /** Image source path. */
  imageSrc: string
  /** Alt text. */
  imageAlt: string
  /** Optional caption rendered alongside the image. */
  caption?: ReactNode
  /**
   * Where to place the caption relative to the image.
   * Default 'right' on md+ screens, stacked below on mobile.
   */
  captionSide?: 'left' | 'right'
  /** Starting y offset (CSS value), default '120vh'. */
  startY?: string
  /** Ending y offset (CSS value), default '-120vh'. */
  endY?: string
  /** Tailwind classes for the outer absolute container. */
  className?: string
  /** Width of the photo (Tailwind class). Default 'max-w-md'. */
  photoWidthClass?: string
  /** Optional inline style for the outer container. */
  style?: CSSProperties
}

/**
 * Saisei-style rising photo card. A photo + optional caption block
 * translates vertically from below the viewport to above it as
 * `scrollProgress` moves through `[scrollStart, scrollEnd]`. Cards are
 * clamped outside that sub-range so they sit below before and above after.
 *
 * Stack several `RisingCard`s with overlapping scroll sub-ranges inside a
 * `relative` parent to create a continuous photo cascade.
 */
export function RisingCard({
  scrollProgress,
  scrollStart,
  scrollEnd,
  imageSrc,
  imageAlt,
  caption,
  captionSide = 'right',
  startY = '120vh',
  endY = '-120vh',
  className,
  photoWidthClass = 'max-w-md',
  style,
}: Props) {
  const reduced = useReducedMotion()

  // Fade in over the first 15% of the sub-range, fade out over the last 15%.
  const span = scrollEnd - scrollStart
  const fadeIn = scrollStart + span * 0.15
  const fadeOut = scrollEnd - span * 0.15

  // Hooks must run unconditionally; they're harmless when `reduced` is true.
  const y = useTransform(scrollProgress, [scrollStart, scrollEnd], [startY, endY])
  // Function-form useTransform — the 4-keyframe array form (`[s,fi,fo,e] →
  // [0,1,1,0]`) failed to subscribe in framer-motion 12 here, leaving
  // opacity pinned at 0. A custom transformer is reliable.
  const opacity = useTransform(scrollProgress, (v: number) => {
    if (v <= scrollStart || v >= scrollEnd) return 0
    if (v < fadeIn) return (v - scrollStart) / (fadeIn - scrollStart)
    if (v > fadeOut) return 1 - (v - fadeOut) / (scrollEnd - fadeOut)
    return 1
  })

  const imageOrderClass = captionSide === 'left' ? 'md:order-2' : 'md:order-1'
  const captionOrderClass = captionSide === 'left' ? 'md:order-1' : 'md:order-2'

  const inner = (
    <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-center md:justify-center md:gap-10">
      <div className={`w-full ${photoWidthClass} ${imageOrderClass}`}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="aspect-[3/4] w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </div>
      {caption && (
        <div className={`flex w-full max-w-sm flex-col gap-2 text-[#4E784F] ${captionOrderClass}`}>
          {caption}
        </div>
      )}
    </div>
  )

  if (reduced) {
    return (
      <div
        className={`absolute inset-0 flex items-center justify-center ${className ?? ''}`}
        style={style}
      >
        {inner}
      </div>
    )
  }

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center ${className ?? ''}`}
      style={{ ...style, y, opacity }}
    >
      {inner}
    </motion.div>
  )
}
