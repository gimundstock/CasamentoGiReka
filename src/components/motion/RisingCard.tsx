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

  // Caption color goes WHITE when the card is overlapping the central
  // dahlia, so the text stays readable on top of the red bloom. Assumes
  // startY / endY are 'Nvh' strings (the default). The card content is
  // flex-centered inside a 100vh div, so its on-screen vertical center
  // is roughly (y + 50vh). White is applied when |y| < 40vh (content
  // center in [10vh, 90vh] — almost the full viewport, matching the
  // dahlia overlap), with a smooth fade to the dark color over 20vh.
  const startYVh = parseFloat(startY)
  const endYVh = parseFloat(endY)
  const captionColor = useTransform(scrollProgress, (v: number) => {
    const t = Math.max(0, Math.min(1, (v - scrollStart) / (scrollEnd - scrollStart)))
    const yVh = startYVh + (endYVh - startYVh) * t
    const absY = Math.abs(yVh)
    let weight = 1
    if (absY > 40) weight = Math.max(0, 1 - (absY - 40) / 20)
    // Interpolate text-forest-deep #3D3229 (61,50,41) → white (255,255,255)
    const r = Math.round(61 + (255 - 61) * weight)
    const g = Math.round(50 + (255 - 50) * weight)
    const b = Math.round(41 + (255 - 41) * weight)
    return `rgb(${r}, ${g}, ${b})`
  })

  const imageOrderClass = captionSide === 'left' ? 'md:order-2' : 'md:order-1'
  const captionOrderClass = captionSide === 'left' ? 'md:order-1' : 'md:order-2'
  // When the caption sits to the LEFT of the image, right-align the text
  // so the end of each line meets the image — otherwise short lines leave
  // whitespace between the caption container's right edge and the image,
  // making it look like there's extra space compared to the right-side
  // variant.
  const captionAlignClass =
    captionSide === 'left' ? 'md:items-end md:text-right' : 'md:items-start md:text-left'

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
        <motion.div
          className={`flex w-full max-w-sm flex-col gap-2 ${captionAlignClass} ${captionOrderClass}`}
          style={{ color: captionColor }}
        >
          {caption}
        </motion.div>
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
