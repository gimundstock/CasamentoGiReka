import { motion, type MotionValue } from 'framer-motion'

interface Props {
  className?: string
  /** Optional motion value for rotation in degrees (e.g. driven by scroll). */
  rotate?: MotionValue<number>
  /** Image source. Defaults to the red dahlia placeholder. */
  src?: string
}

const DEFAULT_SRC = `${import.meta.env.BASE_URL}flowers/red_dahlia_x3.png`

/**
 * The hero flower — used as the morph between Hero 2 (Save the Date)
 * and Hero 3 (Meet the Couple). Renders a static photographic flower
 * (red dahlia by default) with optional scroll-driven rotation.
 *
 * Was previously a pure SVG composition. Now wraps the photo so the
 * same image carries from Hero 2's grow-out into Hero 3's backdrop.
 */
export function Daisy({ className, rotate, src = DEFAULT_SRC }: Props) {
  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden
      className={className}
      style={{
        objectFit: 'contain',
        willChange: 'transform',
        ...(rotate ? { rotate } : null),
      }}
      draggable={false}
    />
  )
}
