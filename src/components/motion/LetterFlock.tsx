import { useMemo } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** The text to animate, broken into letters. Spaces preserved between words. */
  text: string
  /** Element rendered around each letter — defaults to `span`. */
  as?: 'span' | 'div'
  /** Initial delay before the flock starts (auto-play mode only). */
  delay?: number
  /** Delay added between successive letters. */
  stagger?: number
  /** Per-letter motion duration (auto-play mode only). */
  duration?: number
  /** Max random horizontal offset (px). */
  spreadX?: number
  /** Max random vertical offset (px). */
  spreadY?: number
  /** Max random rotation in degrees. */
  spreadRotate?: number
  className?: string
  /** Optional className applied to each letter span. */
  letterClassName?: string
  /**
   * When provided, the flock becomes scroll-driven: each letter
   * interpolates from its scattered initial pose to the final pose as
   * `scrollProgress` moves from 0 → 1. Letters stagger so they settle at
   * slightly different scroll positions.
   */
  scrollProgress?: MotionValue<number>
  /**
   * Fraction of scrollProgress that each letter takes to fully assemble.
   * Default 0.4 — so a letter that starts at progress 0 finishes at 0.4.
   * Letters past that point continue staggering until ~1.0.
   */
  scrollSpan?: number
  /**
   * Gates the timeline-based animation. Useful for triggering the flock
   * from an external event (e.g. first scroll). When `false`, letters
   * stay at their scattered initial pose. When `true` or undefined, the
   * flock plays its entrance once.
   */
  play?: boolean
}

interface LetterSeed {
  char: string
  x: number
  y: number
  rotate: number
  scale: number
  delay: number
  isSpace: boolean
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

function pseudoRandom(seed: number): number {
  // Deterministic per-letter randomness so the flock is the same every mount.
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface ScrollLetterProps {
  seed: LetterSeed
  scrollProgress: MotionValue<number>
  start: number
  end: number
  className?: string
}

function ScrollLetter({ seed, scrollProgress, start, end, className }: ScrollLetterProps) {
  // Each letter owns its own derived motion values so the assembly is
  // continuous and tied directly to scroll position.
  const x = useTransform(scrollProgress, [start, end], [seed.x, 0])
  const y = useTransform(scrollProgress, [start, end], [seed.y, 0])
  const rotate = useTransform(scrollProgress, [start, end], [seed.rotate, 0])
  const scale = useTransform(scrollProgress, [start, end], [seed.scale, 1])
  const opacity = useTransform(scrollProgress, [start, end], [0, 1])

  return (
    <motion.span
      className={`inline-block ${className ?? ''}`}
      style={{ x, y, rotate, scale, opacity }}
      aria-hidden
    >
      {seed.char}
    </motion.span>
  )
}

/**
 * Saisei-style letter-flock entrance. Each character lands from a random
 * offset/rotation/scale into its final position with a staggered ease.
 * Words are kept together via inline-block wrappers so line breaks fall
 * between words, not mid-word.
 *
 * Pass `scrollProgress` (from `useScroll`) to drive the assembly from
 * scroll position instead of playing on mount.
 */
export function LetterFlock({
  text,
  as: _as = 'span',
  delay = 0,
  stagger = 0.04,
  duration = 1.4,
  spreadX = 160,
  spreadY = 80,
  spreadRotate = 14,
  className,
  letterClassName,
  scrollProgress,
  scrollSpan = 0.4,
  play,
}: Props) {
  const reduced = useReducedMotion()

  const seeds = useMemo<LetterSeed[]>(() => {
    return Array.from(text).map((char, i) => {
      const r1 = pseudoRandom(i + 1)
      const r2 = pseudoRandom(i + 100)
      const r3 = pseudoRandom(i + 200)
      const r4 = pseudoRandom(i + 300)
      return {
        char,
        x: (r1 - 0.5) * 2 * spreadX,
        y: (r2 - 0.5) * 2 * spreadY,
        rotate: (r3 - 0.5) * 2 * spreadRotate,
        scale: 0.65 + r4 * 0.7,
        delay: delay + i * stagger,
        isSpace: char === ' ',
      }
    })
  }, [text, delay, stagger, spreadX, spreadY, spreadRotate])

  // Group letters into words so wrapping breaks on spaces, not letters.
  const words = useMemo(() => {
    const result: LetterSeed[][] = []
    let current: LetterSeed[] = []
    for (const seed of seeds) {
      if (seed.isSpace) {
        if (current.length) result.push(current)
        current = []
      } else {
        current.push(seed)
      }
    }
    if (current.length) result.push(current)
    return result
  }, [seeds])

  if (reduced) {
    return <span className={className}>{text}</span>
  }

  // Pre-compute per-letter scroll ranges if in scroll-driven mode. Stagger
  // letters so they don't all assemble simultaneously — gives the same
  // "flock landing" feel as the timeline mode, just tied to scroll.
  const nonSpaceCount = seeds.filter((s) => !s.isSpace).length
  const perLetterOffset =
    scrollProgress && nonSpaceCount > 1 ? (1 - scrollSpan) / (nonSpaceCount - 1) : 0

  let letterIndex = 0

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.map((seed, li) => {
            const i = letterIndex++
            if (scrollProgress) {
              const start = i * perLetterOffset
              const end = Math.min(start + scrollSpan, 1)
              return (
                <ScrollLetter
                  key={`${wi}-${li}`}
                  seed={seed}
                  scrollProgress={scrollProgress}
                  start={start}
                  end={end}
                  className={letterClassName}
                />
              )
            }
            const final = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
            const initial = {
              x: seed.x,
              y: seed.y,
              rotate: seed.rotate,
              scale: seed.scale,
              opacity: 0,
            }
            // play === false → stay scattered. play === true or undefined
            // → animate to final (undefined keeps the original auto-play).
            const animate = play === false ? initial : final
            return (
              <motion.span
                key={`${wi}-${li}`}
                className={`inline-block ${letterClassName ?? ''}`}
                initial={initial}
                animate={animate}
                transition={{ duration, delay: seed.delay, ease: EASE }}
                aria-hidden
              >
                {seed.char}
              </motion.span>
            )
          })}
          {wi < words.length - 1 && <span aria-hidden> </span>}
        </span>
      ))}
    </span>
  )
}
