import { motion, useMotionTemplate, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from '../motion/useReducedMotion'

/**
 * The hand-drawn Catedral Metropolitana, revealed left to right as the section
 * scrolls in.
 *
 * The source is a raster, so there is no `pathLength` to animate the way
 * `BrasiliaLineArt` did. A soft-edged gradient MASK sweeping across the image
 * gives the same "being drawn" impression without needing vector paths: `trail`
 * is the opaque edge that has already been revealed, `lead` the transparent
 * front, and the gap between them is the soft drawing edge.
 */

const SRC = `${import.meta.env.BASE_URL}illustrations/catedral.png`

const REVEAL_START = 0.1
const REVEAL_END = 0.85
const FEATHER = 18 // width of the soft front, in % of the image

// The right side of the drawing runs under the text column; fade it so the
// copy on top stays readable.
const RIGHT_FADE = 'linear-gradient(to right, #000 58%, rgba(0, 0, 0, 0.3) 82%)'

export function CathedralArt({
  progress,
  className = '',
}: {
  progress: MotionValue<number>
  className?: string
}) {
  const reduced = useReducedMotion()

  // Start below 0 and finish past 100 so the drawing is fully hidden at the
  // beginning and fully solid at the end rather than clipped at either edge.
  const trail = useTransform(progress, [REVEAL_START, REVEAL_END], [-FEATHER, 100], {
    clamp: true,
  })
  const lead = useTransform(progress, [REVEAL_START, REVEAL_END], [0, 100 + FEATHER], {
    clamp: true,
  })
  // Two mask layers, intersected: the moving reveal and the static right fade.
  const maskImage = useMotionTemplate`linear-gradient(to right, #000 ${trail}%, transparent ${lead}%), ${RIGHT_FADE}`

  if (reduced) {
    return (
      <img
        src={SRC}
        alt=""
        aria-hidden
        className={`block select-none ${className}`}
        style={{ maskImage: RIGHT_FADE, WebkitMaskImage: RIGHT_FADE }}
      />
    )
  }

  return (
    <motion.img
      src={SRC}
      alt=""
      aria-hidden
      className={`block select-none ${className}`}
      style={{
        maskImage,
        WebkitMaskImage: maskImage,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }}
    />
  )
}
