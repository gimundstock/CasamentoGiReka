import { useMemo } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { Petal } from '../botanicals/Petal'
import { Flower } from '../botanicals/Flower'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** Scroll progress driving the rise. */
  scrollProgress: MotionValue<number>
  /** Number of items in the field. Default 12. */
  count?: number
  /** Palette to cycle through (hex colors). Default uses the new Saisei palette. */
  palette?: string[]
  /**
   * What kind of item to render.
   * - 'petal' — Petal botanical SVG (default)
   * - 'flower' — small Flower SVG, filler variant
   * - 'image' — render <img> elements; requires the `images` prop. Use this
   *   to drop placeholder PNG/JPG/SVG files that you can swap for real
   *   flower photos later.
   */
  variant?: 'petal' | 'flower' | 'image'
  /** Image URLs to cycle through. Required when variant === 'image'. */
  images?: string[]
  /** Min/max item size. */
  sizeMin?: number
  sizeMax?: number
  className?: string
}

interface FieldItem {
  leftPercent: number
  color: string
  size: number
  rotation: number
  scrollStart: number
  imageSrc: string | null
}

const DEFAULT_PALETTE = ['#A88A9D', '#B9AFC1', '#C58A7A', '#D89A35', '#B96F52', '#B8C2A3']

// How much scroll progress each item takes to traverse the viewport from
// below to above. Larger = slower visible drift per unit of scroll. The
// rise window is NOT clamped at progress=1, so items that start late are
// still mid-rise when the user finishes scrolling — keeps the field
// populated all the way through, not just at the start.
const RISE_SPAN = 0.7

// Latest scroll-progress an item can start at. Items spread evenly across
// [0, MAX_START] with a small jitter. Pushed late enough that the field
// is still busy near the end of the section.
const MAX_START = 0.85

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface FloatItemProps {
  item: FieldItem
  variant: 'petal' | 'flower' | 'image'
  scrollProgress: MotionValue<number>
}

function FloatItem({ item, variant, scrollProgress }: FloatItemProps) {
  // Don't clamp `end` at 1 — late starters with a long rise span will be
  // mid-traverse at scroll progress 1.0, leaving the field populated
  // through the end of the section.
  const end = item.scrollStart + RISE_SPAN
  const y = useTransform(scrollProgress, [item.scrollStart, end], ['120vh', '-120vh'])

  return (
    <motion.div
      className="absolute"
      style={{ left: `${item.leftPercent}%`, top: 0, y }}
      aria-hidden
    >
      {variant === 'image' && item.imageSrc ? (
        <img
          src={item.imageSrc}
          alt=""
          width={item.size}
          height={item.size}
          style={{
            transform: `rotate(${item.rotation}deg)`,
            display: 'block',
            objectFit: 'contain',
          }}
        />
      ) : variant === 'petal' ? (
        <Petal color={item.color} size={item.size} rotation={item.rotation} />
      ) : (
        <svg
          width={item.size}
          height={item.size}
          viewBox={`${-item.size / 2} ${-item.size / 2} ${item.size} ${item.size}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: `rotate(${item.rotation}deg)` }}
          aria-hidden
        >
          <Flower
            cx={0}
            cy={0}
            variant="filler"
            size={item.size / 16}
            color={item.color}
            animate={false}
          />
        </svg>
      )}
    </motion.div>
  )
}

/**
 * Saisei-style floating petal/flower/image field. Renders an absolutely
 * positioned, full-bleed layer of items whose vertical position is tied
 * to a `scrollProgress` motion value. Each item is staggered so the field
 * appears to rise continuously.
 *
 * Pass `variant='image'` + an `images` array (file paths in /public) for
 * placeholder-image mode — useful for dropping real flower photos in.
 *
 * Layout/colors are deterministic per-mount. Respects prefers-reduced-motion.
 */
export function FloatField({
  scrollProgress,
  count = 12,
  palette = DEFAULT_PALETTE,
  variant = 'petal',
  images,
  sizeMin = 10,
  sizeMax = 22,
  className,
}: Props) {
  const reduced = useReducedMotion()

  const items = useMemo<FieldItem[]>(() => {
    const usingImages = variant === 'image' && images && images.length > 0
    return Array.from({ length: count }, (_, i) => {
      const r1 = pseudoRandom(i + 1)
      const r2 = pseudoRandom(i + 101)
      const r3 = pseudoRandom(i + 211)
      const r4 = pseudoRandom(i + 307)
      const evenStart = count > 1 ? (i / (count - 1)) * MAX_START : 0
      const jitter = (r4 - 0.5) * (MAX_START / Math.max(count, 1)) * 0.6
      const scrollStart = Math.min(MAX_START, Math.max(0, evenStart + jitter))
      return {
        leftPercent: r1 * 100,
        color: palette[Math.floor(r2 * palette.length) % palette.length] as string,
        size: sizeMin + r3 * (sizeMax - sizeMin),
        rotation: r1 * 360,
        scrollStart,
        imageSrc: usingImages ? (images[i % images.length] as string) : null,
      }
    })
  }, [count, palette, sizeMin, sizeMax, variant, images])

  if (reduced) return null

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ''}`}
    >
      {items.map((item, i) => (
        <FloatItem key={i} item={item} variant={variant} scrollProgress={scrollProgress} />
      ))}
    </div>
  )
}
