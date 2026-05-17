import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** The text to animate, broken into letters. Spaces preserved between words. */
  text: string
  /** Element rendered around each letter — defaults to `span`. */
  as?: 'span' | 'div'
  /** Initial delay before the flock starts. */
  delay?: number
  /** Delay added between successive letters. */
  stagger?: number
  /** Per-letter motion duration. */
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

/**
 * Saisei-style letter-flock entrance. Each character lands from a random
 * offset/rotation/scale into its final position with a staggered ease.
 * Words are kept together via inline-block wrappers so line breaks fall
 * between words, not mid-word.
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

  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.map((seed, li) => (
            <motion.span
              key={`${wi}-${li}`}
              className={`inline-block ${letterClassName ?? ''}`}
              initial={{
                x: seed.x,
                y: seed.y,
                rotate: seed.rotate,
                scale: seed.scale,
                opacity: 0,
              }}
              animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              transition={{ duration, delay: seed.delay, ease: EASE }}
              aria-hidden
            >
              {seed.char}
            </motion.span>
          ))}
          {wi < words.length - 1 && <span aria-hidden>{' '}</span>}
        </span>
      ))}
    </span>
  )
}
