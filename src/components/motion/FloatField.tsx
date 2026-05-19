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
  /**
   * Fraction (0–1) of items that should be PRE-POPULATED in the viewport
   * at scrollProgress = 0 — they're scattered at various points along
   * their rise rather than all queued below the fold. Use ~0.4 to give the
   * field a "garden already in bloom" feel from the very first frame.
   * Default 0 (all items start below viewport, classic rise-from-below).
   */
  prefill?: number
  /**
   * Bias items toward the LEFT half of the viewport. 0 = uniform across
   * full width (default). 0.5 = clamp into the left 50 %. 1 = clamp into
   * the leftmost sliver. Use to even out the field on the left when the
   * primary pass happens to cluster right.
   */
  leftBias?: number
  /**
   * Top guard, percent of the field's parent height. The bounding box of
   * the field starts this far down from the parent's top, so flowers can
   * never visually drift into the upper region (where typography sits).
   * Default 0 (field spans the whole parent).
   */
  topGuardPct?: number
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
  prefill = 0,
  leftBias = 0,
  topGuardPct = 0,
  className,
}: Props) {
  const reduced = useReducedMotion()

  const items = useMemo<FieldItem[]>(() => {
    const usingImages = variant === 'image' && images && images.length > 0
    const prefillCount = Math.max(0, Math.min(count, Math.round(count * prefill)))
    return Array.from({ length: count }, (_, i) => {
      const r1 = pseudoRandom(i + 1)
      const r2 = pseudoRandom(i + 101)
      const r3 = pseudoRandom(i + 211)
      const r4 = pseudoRandom(i + 307)
      // Pre-populated items get a NEGATIVE scrollStart so they're already
      // mid-rise at scrollProgress = 0 — visually they're scattered across
      // the viewport from the very first frame. The offset is spread so
      // they're at varied heights, not all stacked at the same spot.
      let scrollStart: number
      if (i < prefillCount) {
        const spread = prefillCount > 1 ? i / (prefillCount - 1) : 0.5
        // Map to roughly [-0.65 * RISE_SPAN, -0.15 * RISE_SPAN] with jitter
        // — at progress 0, y lands somewhere across most of the viewport.
        const baseNegative = -(0.15 + spread * 0.5) * RISE_SPAN
        const jitter = (r4 - 0.5) * RISE_SPAN * 0.08
        scrollStart = baseNegative + jitter
      } else {
        const remaining = count - prefillCount
        const localIndex = i - prefillCount
        const evenStart = remaining > 1 ? (localIndex / (remaining - 1)) * MAX_START : 0
        const jitter = (r4 - 0.5) * (MAX_START / Math.max(remaining, 1)) * 0.6
        scrollStart = Math.min(MAX_START, Math.max(0, evenStart + jitter))
      }
      // Apply leftBias: clamp the horizontal distribution into the left
      // (1 - leftBias) fraction of the viewport. e.g. leftBias=0.5 keeps
      // items in left 50 %; leftBias=0 spans the full width.
      const leftSpan = Math.max(0.05, 1 - leftBias)
      const leftPercent = r1 * 100 * leftSpan
      const imageSrc = usingImages ? (images[i % images.length] as string) : null
      // Lavender always renders upright — rotating it makes it look like
      // a fallen sprig instead of a standing flower. Other species get
      // the random rotation.
      const isUpright = imageSrc !== null && imageSrc.includes('lavender')
      const rotation = isUpright ? 0 : r1 * 360
      return {
        leftPercent,
        color: palette[Math.floor(r2 * palette.length) % palette.length] as string,
        size: sizeMin + r3 * (sizeMax - sizeMin),
        rotation,
        scrollStart,
        imageSrc,
      }
    })
  }, [count, palette, sizeMin, sizeMax, variant, images, prefill, leftBias])

  if (reduced) return null

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden ${className ?? ''}`}
      style={{ top: `${topGuardPct}%` }}
    >
      {items.map((item, i) => (
        <FloatItem key={i} item={item} variant={variant} scrollProgress={scrollProgress} />
      ))}
    </div>
  )
}
