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

export function CathedralArt({ progress }: { progress: MotionValue<number> }) {
  const reduced = useReducedMotion()

  // Start below 0 and finish past 100 so the drawing is fully hidden at the
  // beginning and fully solid at the end rather than clipped at either edge.
  const trail = useTransform(progress, [REVEAL_START, REVEAL_END], [-FEATHER, 100], {
    clamp: true,
  })
  const lead = useTransform(progress, [REVEAL_START, REVEAL_END], [0, 100 + FEATHER], {
    clamp: true,
  })
  const maskImage = useMotionTemplate`linear-gradient(to right, #000 ${trail}%, transparent ${lead}%)`

  if (reduced) {
    return <img src={SRC} alt="" aria-hidden className="block w-full h-auto select-none" />
  }

  return (
    <motion.img
      src={SRC}
      alt=""
      aria-hidden
      className="block w-full h-auto select-none"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    />
  )
}
