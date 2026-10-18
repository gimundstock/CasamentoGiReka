import { useLayoutEffect, useMemo, useRef } from 'react'
import type { MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** Flower cut-outs (stems and all). They fall slowly and turn gently. */
  flowers: string[]
  /** Loose petals. They fall a little faster and flutter as they go. */
  petals: string[]
  flowerCount?: number
  petalCount?: number
  /**
   * Section scroll progress. Scrolling pushes every item further down its
   * path on top of the time-based fall, so the field responds to the
   * scroll without ever stopping when the reader pauses.
   */
  scrollProgress: MotionValue<number>
  /** Screen-heights of extra fall added across a full 0 → 1 of progress. */
  scrollBoost?: number
  /** Stop updating past this progress (the layer is faded out by then). */
  activeUntil?: number
}

interface Item {
  src: string
  petal: boolean
  /** Horizontal anchor, 0–1 of the container width. */
  x: number
  scale: number
  /** Seconds for one full top-to-bottom pass. */
  period: number
  /** Starting point along the pass, 0–1, so the field is full at once. */
  phase: number
  swayAmp: number
  swayPeriod: number
  swayPhase: number
  rotate0: number
  /** Degrees per second. */
  spin: number
  flutterPeriod: number
}

// Small deterministic PRNG so the layout is the same on every render.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildItems(flowers: string[], petals: string[], flowerCount: number, petalCount: number) {
  const rand = mulberry32(20270605)
  const between = (min: number, max: number) => min + rand() * (max - min)
  const items: Item[] = []
  const total = flowerCount + petalCount
  for (let i = 0; i < total; i++) {
    const petal = i >= flowerCount
    const pool = petal ? petals : flowers
    const k = petal ? i - flowerCount : i
    items.push({
      src: pool[k % pool.length],
      petal,
      // Flowers and petals are each stratified across the full width, so
      // neither group bunches up on one side.
      x: (k + rand()) / (petal ? petalCount : flowerCount),
      scale: petal ? between(0.8, 1.2) : between(0.75, 1.15),
      period: petal ? between(9, 14) : between(13, 21),
      phase: rand(),
      swayAmp: petal ? between(25, 60) : between(15, 40),
      swayPeriod: petal ? between(2.5, 4.5) : between(4, 7),
      swayPhase: rand() * Math.PI * 2,
      rotate0: between(-40, 40),
      spin: (rand() < 0.5 ? -1 : 1) * (petal ? between(20, 60) : between(4, 14)),
      flutterPeriod: between(1.2, 2.4),
    })
  }
  // Shuffle the stacking order so petals aren't all on top of the flowers.
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

/**
 * Flowers and petals falling one by one, each on its own path: a steady
 * time-based drop with a side-to-side sway and a slow turn, plus a push
 * from the section scroll. Positions are written straight to each
 * element's transform in a single rAF loop, so React never re-renders
 * while it runs.
 */
export function FallingFlowers({
  flowers,
  petals,
  flowerCount = 16,
  petalCount = 20,
  scrollProgress,
  scrollBoost = 2.5,
  activeUntil = 0.5,
}: Props) {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLImageElement | null)[]>([])
  const items = useMemo(
    () => buildItems(flowers, petals, flowerCount, petalCount),
    [flowers, petals, flowerCount, petalCount]
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    let frame = 0
    const start = performance.now()

    function place(time: number) {
      const w = container!.clientWidth
      const h = container!.clientHeight
      const progress = scrollProgress.get()
      // Items start a little above the top edge and leave below the bottom.
      const margin = 220
      const travel = h + margin * 2
      items.forEach((it, i) => {
        const el = itemRefs.current[i]
        if (!el) return
        // Faster items also respond more to the scroll push.
        const pass = time / it.period + progress * scrollBoost * (12 / it.period) + it.phase
        const along = pass - Math.floor(pass)
        const y = -margin + along * travel
        const sway = Math.sin((time / it.swayPeriod) * Math.PI * 2 + it.swayPhase)
        const x = it.x * w + sway * it.swayAmp
        // Lean into the sway, plus a slow continuous turn.
        const rotate = it.rotate0 + it.spin * time + sway * 12
        const flutter = it.petal
          ? ` scaleY(${0.55 + 0.45 * Math.abs(Math.cos((time / it.flutterPeriod) * Math.PI))})`
          : ''
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotate}deg) scale(${it.scale})${flutter}`
      })
    }

    if (reduced) {
      place(0)
      return
    }

    function tick(now: number) {
      if (scrollProgress.get() <= activeUntil) place((now - start) / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [items, reduced, scrollProgress, scrollBoost, activeUntil])

  return (
    <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0">
      {items.map((it, i) => (
        <img
          key={i}
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          src={it.src}
          alt=""
          draggable={false}
          className="absolute top-0 left-0 max-w-none select-none"
          style={{ willChange: 'transform' }}
        />
      ))}
    </div>
  )
}
