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
  /** Gate the auto-play. `false` keeps letters edge-on, `true` plays. */
  play?: boolean
  /** Initial uniform scale per letter. Default 0.25 — letters grow as they flip. */
  scaleFrom?: number
  /** Final uniform scale. Default 1. */
  scaleTo?: number
  /** Fade letters in by interpolating opacity 0→1 alongside the flip. Default false. */
  withFade?: boolean
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const LETTER_STYLE = {
  display: 'inline-block',
  transformOrigin: 'center',
  backfaceVisibility: 'hidden',
  transformStyle: 'preserve-3d',
} as const

interface LetterToken {
  char: string
  isSpace: boolean
  /** Index across all non-space letters — drives the stagger. */
  letterIndex: number
}

interface LineToken {
  letters: LetterToken[]
}

interface ScrollLetterProps {
  char: string
  scrollProgress: MotionValue<number>
  start: number
  end: number
  scaleFrom: number
  scaleTo: number
  withFade: boolean
  className?: string
}

function ScrollLetter({
  char,
  scrollProgress,
  start,
  end,
  scaleFrom,
  scaleTo,
  withFade,
  className,
}: ScrollLetterProps) {
  // Per-letter hooks are extracted into a sub-component so we don't break
  // the rules-of-hooks (no hooks in a map).
  const rotateY = useTransform(scrollProgress, [start, end], [90, 0])
  const scaleX = useTransform(scrollProgress, [start, end], [0, 1])
  const scale = useTransform(scrollProgress, [start, end], [scaleFrom, scaleTo])
  const opacity = useTransform(scrollProgress, [start, end], withFade ? [0, 1] : [1, 1])

  return (
    <motion.span className={className} style={{ ...LETTER_STYLE, rotateY, scaleX, scale, opacity }}>
      {char}
    </motion.span>
  )
}

/**
 * 3D letter-flip headline. Each character flips in from edge-on
 * (`rotateY: 90deg`) to face-on (`rotateY: 0deg`), pairs with a
 * horizontal scale for the flip emphasis, and grows from `scaleFrom`
 * to `scaleTo` so letters get larger as they assemble. Letters start at
 * staggered scroll/time points but all finish at the same instant — the
 * line resolves in a single beat.
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
  scaleFrom = 0.25,
  scaleTo = 1,
  withFade = false,
}: Props) {
  const reduced = useReducedMotion()

  const { lines, totalLetters } = useMemo(() => {
    const rawLines = text.split('\n')
    let counter = 0
    const built: LineToken[] = rawLines.map((line) => {
      const letters: LetterToken[] = Array.from(line).map((char) => {
        const isSpace = char === ' '
        const token: LetterToken = {
          char,
          isSpace,
          letterIndex: isSpace ? -1 : counter,
        }
        if (!isSpace) counter += 1
        return token
      })
      return { letters }
    })
    return { lines: built, totalLetters: counter }
  }, [text])

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
  const denom = Math.max(totalLetters, 1)

  const autoStep = (duration * safeStagger) / denom
  const scrollWindow = Math.max(0, scrollEnd - scrollStart)
  const scrollStep = (scrollWindow * safeStagger) / denom

  return (
    <span
      className={className}
      style={{ perspective: '1000px' }}
      aria-label={text.replace(/\n/g, ' ')}
    >
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
                  scaleFrom={scaleFrom}
                  scaleTo={scaleTo}
                  withFade={withFade}
                  className={letterClassName}
                />
              )
            }

            const letterStart = i * autoStep
            const letterDuration = Math.max(duration - letterStart, 0.001)
            const initial = {
              rotateY: 90,
              scaleX: 0,
              scale: scaleFrom,
              opacity: withFade ? 0 : 1,
            }
            const final = { rotateY: 0, scaleX: 1, scale: scaleTo, opacity: 1 }
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
