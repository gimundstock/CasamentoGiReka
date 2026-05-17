import { motion, useScroll, useTransform } from 'framer-motion'
import { useReducedMotion } from '../motion/useReducedMotion'

// A subtle atmospheric thread that runs vertically behind the entire page,
// "drawing itself" as the user scrolls. On mobile we render a single vine;
// on md+ we add a second, gently mirrored vine for layered depth.
//
// The SVG is fixed to the viewport with -z-10 and pointer-events-none so it
// never blocks clicks or pushes layout. The viewBox is 100x1000 — the strokes
// are described in a tall vertical space and scaled by preserveAspectRatio
// 'none' so they stretch to the viewport height.
//
// Path generation: a single bezier-stitched wavy line meandering between
// x=20 and x=80 over 10 segments. Strokes are very thin and rendered at low
// opacity in forest-deep so they read as ambient texture rather than ornament.

const VINE_LEFT =
  'M 30 0 C 10 80 60 160 30 240 C 0 320 60 400 30 480 C 0 560 60 640 30 720 C 0 800 60 880 30 1000'
const VINE_RIGHT =
  'M 70 0 C 90 80 40 160 70 240 C 100 320 40 400 70 480 C 100 560 40 640 70 720 C 100 800 40 880 70 1000'

export function BackgroundVine() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()

  // Begin drawing slightly before the user has scrolled and finish well before
  // the bottom — so the vine feels established but not over-eager.
  const pathLength = useTransform(scrollYProgress, [0.05, 0.95], [0, 1])

  const sharedProps = {
    stroke: '#3F6041',
    strokeWidth: 0.6,
    strokeLinecap: 'round' as const,
    fill: 'none',
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.1 }}
      >
        {reduced ? (
          <>
            <path d={VINE_LEFT} {...sharedProps} />
            <path d={VINE_RIGHT} {...sharedProps} className="hidden md:block" />
          </>
        ) : (
          <>
            <motion.path d={VINE_LEFT} {...sharedProps} style={{ pathLength }} />
            <motion.path
              d={VINE_RIGHT}
              {...sharedProps}
              className="hidden md:block"
              style={{ pathLength }}
            />
          </>
        )}
      </svg>
    </div>
  )
}
