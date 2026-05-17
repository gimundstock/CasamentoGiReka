import { useMemo } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  /** Text to animate. Use \n to break into multiple lines. */
  text: string
  /** Total animation duration (auto-play mode), in seconds. Default 1.6. */
  duration?: number
  /** Initial delay before the auto-play starts. Default 0. */
  delay?: number
  /**
   * Fraction of the total duration/scroll-range that staggered starts are
   * spread across. 0 = all letters start together. 1 = the last letter
   * starts only at the very end. Default 0.85 — strong stagger.
   */
  staggerRatio?: number
  /** Optional className applied to the outer wrapper span. */
  className?: string
  /** Optional className applied to each line span. */
  lineClassName?: string
  /** Optional className applied to each letter span. */
  letterClassName?: string
  /** Scroll-driven mode: animation tied to this MotionValue from useScroll. */
  scrollProgress?: MotionValue<number>
  /** Scroll range start (0–1). Default 0. */
  scrollStart?: number
  /** Scroll range end (0–1). Default 1. */
  scrollEnd?: number
  /** Gate the auto-play. `false` keeps letters scattered, `true` plays. */
  play?: boolean
  /** Max random horizontal offset each letter starts at, in px. Default 400. */
  spreadX?: number
  /** Max random vertical offset each letter starts at, in px. Default 240. */
  spreadY?: number
  /**
   * Max random 2D rotation each letter starts at, in degrees. Default 180
   * — letters can begin upside down or at any angle.
   */
  spreadRotate?: number
  /**
   * Initial scale for the smallest letters. Each letter picks a starting
   * scale somewhere in `[scaleFrom, scaleFrom + scaleVariance]`. Default
   * 0.3 — most letters start small and grow.
   */
  scaleFrom?: number
  /**
   * Random variance on the starting scale (so some letters begin a bit
   * bigger than `scaleFrom`). Default 0.8 — start scales land somewhere in
   * [0.3, 1.1] with the defaults, giving size variety at the scattered
   * state.
   */
  scaleVariance?: number
  /** Final scale. Default 1. */
  scaleTo?: number
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const LETTER_STYLE = {
  display: 'inline-block',
  transformOrigin: 'center',
  willChange: 'transform',
} as const

interface LetterToken {
  char: string
  isSpace: boolean
  /** Index across non-space letters — drives the stagger and randomness. */
  letterIndex: number
  initialX: number
  initialY: number
  initialRotate: number
  initialScale: number
}

interface LineToken {
  letters: LetterToken[]
}

function pseudoRandom(seed: number): number {
  // Deterministic per-letter randomness so the scatter is stable across mounts.
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface ScrollLetterProps {
  char: string
  scrollProgress: MotionValue<number>
  start: number
  end: number
  initialX: number
  initialY: number
  initialRotate: number
  initialScale: number
  scaleTo: number
  className?: string
}

function ScrollLetter({
  char,
  scrollProgress,
  start,
  end,
  initialX,
  initialY,
  initialRotate,
  initialScale,
  scaleTo,
  className,
}: ScrollLetterProps) {
  // Per-letter hooks live in a sub-component so we don't break rules-of-hooks
  // (no hook calls inside a map). Each letter interpolates its scattered
  // initial pose (random x/y/rotation/scale) → its resting pose (0/0/0/scaleTo).
  const x = useTransform(scrollProgress, [start, end], [initialX, 0])
  const y = useTransform(scrollProgress, [start, end], [initialY, 0])
  const rotate = useTransform(scrollProgress, [start, end], [initialRotate, 0])
  const scale = useTransform(scrollProgress, [start, end], [initialScale, scaleTo])

  return (
    <motion.span className={className} style={{ ...LETTER_STYLE, x, y, rotate, scale }}>
      {char}
    </motion.span>
  )
}

/**
 * Scatter-and-collect headline. Each character starts at a random
 * position / rotation / scale (rotation can include 180°, so letters
 * may start upside down) and gathers to its resting pose as the
 * scroll progresses. Letters start at staggered scroll/time points
 * but all finish at the same instant — the line resolves in a single
 * beat.
 *
 * Pass `scrollProgress` (from `useScroll`) for scroll-driven mode.
 */
export function FlipLetters({
  text,
  duration = 1.6,
  delay = 0,
  staggerRatio = 0.85,
  className,
  lineClassName,
  letterClassName,
  scrollProgress,
  scrollStart = 0,
  scrollEnd = 1,
  play,
  spreadX = 400,
  spreadY = 240,
  spreadRotate = 180,
  scaleFrom = 0.3,
  scaleVariance = 0.8,
  scaleTo = 1,
}: Props) {
  const reduced = useReducedMotion()

  const { lines, totalLetters } = useMemo(() => {
    const rawLines = text.split('\n')
    let counter = 0
    const built: LineToken[] = rawLines.map((line) => {
      const letters: LetterToken[] = Array.from(line).map((char) => {
        const isSpace = char === ' '
        if (isSpace) {
          return {
            char,
            isSpace,
            letterIndex: -1,
            initialX: 0,
            initialY: 0,
            initialRotate: 0,
            initialScale: 1,
          }
        }
        const i = counter
        counter += 1
        // Four independent pseudo-random seeds per letter for stable shuffling.
        const rx = pseudoRandom(i * 4 + 11)
        const ry = pseudoRandom(i * 4 + 23)
        const rr = pseudoRandom(i * 4 + 47)
        const rs = pseudoRandom(i * 4 + 91)
        return {
          char,
          isSpace,
          letterIndex: i,
          initialX: (rx - 0.5) * 2 * spreadX,
          initialY: (ry - 0.5) * 2 * spreadY,
          initialRotate: (rr - 0.5) * 2 * spreadRotate,
          initialScale: scaleFrom + rs * scaleVariance,
        }
      })
      return { letters }
    })
    return { lines: built, totalLetters: counter }
  }, [text, spreadX, spreadY, spreadRotate, scaleFrom, scaleVariance])

  if (reduced) {
    return (
      <span className={className}>
        {lines.map((line, li) => (
          <span key={li} className={`block ${lineClassName ?? ''}`}>
            {line.letters.map((l) => l.char).join('') || ' '}
          </span>
        ))}
      </span>
    )
  }

  const safeStagger = Math.max(0, Math.min(1, staggerRatio))
  const denom = Math.max(totalLetters - 1, 1)
  const autoStep = (duration * safeStagger) / denom
  const scrollWindow = Math.max(0, scrollEnd - scrollStart)
  const scrollStep = (scrollWindow * safeStagger) / denom

  return (
    <span className={className} aria-label={text.replace(/\n/g, ' ')}>
      {lines.map((line, li) => (
        <span key={li} className={`block ${lineClassName ?? ''}`} aria-hidden>
          {line.letters.length === 0 ? ' ' : null}
          {line.letters.map((letter, ci) => {
            if (letter.isSpace) {
              return <span key={`${li}-${ci}`}> </span>
            }
            const i = letter.letterIndex

            if (scrollProgress) {
              const start = scrollStart + i * scrollStep
              const end = scrollEnd
              return (
                <ScrollLetter
                  key={`${li}-${ci}`}
                  char={letter.char}
                  scrollProgress={scrollProgress}
                  start={start}
                  end={end}
                  initialX={letter.initialX}
                  initialY={letter.initialY}
                  initialRotate={letter.initialRotate}
                  initialScale={letter.initialScale}
                  scaleTo={scaleTo}
                  className={letterClassName}
                />
              )
            }

            const letterStart = i * autoStep
            const letterDuration = Math.max(duration - letterStart, 0.001)
            const initial = {
              x: letter.initialX,
              y: letter.initialY,
              rotate: letter.initialRotate,
              scale: letter.initialScale,
            }
            const final = { x: 0, y: 0, rotate: 0, scale: scaleTo }
            const animate = play === false ? initial : final

            return (
              <motion.span
                key={`${li}-${ci}`}
                className={letterClassName}
                style={LETTER_STYLE}
                initial={initial}
                animate={animate}
                transition={{
                  duration: letterDuration,
                  delay: delay + letterStart,
                  ease: EASE,
                }}
              >
                {letter.char}
              </motion.span>
            )
          })}
        </span>
      ))}
    </span>
  )
}
