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
   * What kind of item to render. 'petal' uses the Petal botanical;
   * 'flower' uses small Flower instances (filler variant).
   * Default 'petal'.
   */
  variant?: 'petal' | 'flower'
  /** Min/max item size. Defaults are reasonable for a backdrop. */
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
}

const DEFAULT_PALETTE = ['#A88A9D', '#B9AFC1', '#C58A7A', '#D89A35', '#B96F52', '#B8C2A3']

const RISE_SPAN = 0.4

function pseudoRandom(seed: number): number {
  // Deterministic per-item randomness so the field is stable across mounts.
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface FloatItemProps {
  item: FieldItem
  variant: 'petal' | 'flower'
  scrollProgress: MotionValue<number>
}

function FloatItem({ item, variant, scrollProgress }: FloatItemProps) {
  // Per-item useTransform must live in a sub-component so the hook isn't
  // called inside a map. Items rise from below the viewport to above it
  // as scrollProgress crosses their staggered window.
  const end = Math.min(item.scrollStart + RISE_SPAN, 1)
  const y = useTransform(scrollProgress, [item.scrollStart, end], ['120vh', '-120vh'])

  return (
    <motion.div
      className="absolute"
      style={{ left: `${item.leftPercent}%`, top: 0, y }}
      aria-hidden
    >
      {variant === 'petal' ? (
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
 * Saisei-style floating petal/flower field. Renders an absolutely-positioned,
 * full-bleed layer of small botanicals whose vertical position is tied to a
 * `scrollProgress` motion value. Each item is staggered so the field appears
 * to rise continuously as the user scrolls.
 *
 * Layout/colors are deterministic per-mount via a seeded PRNG. Respects
 * prefers-reduced-motion (renders nothing when reduced).
 */
export function FloatField({
  scrollProgress,
  count = 12,
  palette = DEFAULT_PALETTE,
  variant = 'petal',
  sizeMin = 10,
  sizeMax = 22,
  className,
}: Props) {
  const reduced = useReducedMotion()

  const items = useMemo<FieldItem[]>(() => {
    // Stagger: each item starts its rise at a unique offset within
    // [0, 0.7], leaving 0.3 of scrollProgress for the last starter to
    // fully rise out of view. Spreading starts evenly (rather than
    // randomly) guarantees a continuous flow with no clumping.
    const maxStart = 0.7
    return Array.from({ length: count }, (_, i) => {
      const r1 = pseudoRandom(i + 1)
      const r2 = pseudoRandom(i + 101)
      const r3 = pseudoRandom(i + 211)
      const r4 = pseudoRandom(i + 307)
      const evenStart = count > 1 ? (i / (count - 1)) * maxStart : 0
      // Jitter the start a little so the rise feels organic, not mechanical.
      const jitter = (r4 - 0.5) * (maxStart / Math.max(count, 1)) * 0.6
      const scrollStart = Math.min(maxStart, Math.max(0, evenStart + jitter))
      return {
        leftPercent: r1 * 100,
        color: palette[Math.floor(r2 * palette.length) % palette.length] as string,
        size: sizeMin + r3 * (sizeMax - sizeMin),
        rotation: r1 * 360,
        scrollStart,
      }
    })
  }, [count, palette, sizeMin, sizeMax])

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
