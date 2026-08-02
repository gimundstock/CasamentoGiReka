import { motion, useTransform, type MotionValue } from 'framer-motion'
import { CERRADO_PATHS, CERRADO_TRANSFORM, CERRADO_VIEWBOX } from './cerradoPaths'

// Framing — matches the prior slide-up rest state: pinned to the bottom, 110 %
// wide and nudged down 20 % so the traced bottom margin sits off-screen.
const FRAME =
  'pointer-events-none absolute bottom-0 left-[-5%] z-30 block h-auto w-[110%] max-w-none translate-y-[20%] select-none'

// Scroll window over which the drawing reveals, plus the width of the soft
// fading front (in objectBoundingBox units — i.e. a fraction of each path).
const REVEAL_START = 0.12
const REVEAL_END = 0.78
const FEATHER = 0.14

/**
 * The cerrado scene drawn on as you scroll. The source SVG is line art
 * vectorized as filled strokes (each visible line is a fill-rule ring), so the
 * 17 `<path>` elements are kept WHOLE — splitting them into contours collapses
 * the rings into solid blobs.
 *
 * Each path is masked by one shared gradient in `objectBoundingBox` units, so
 * the gradient normalises to every path's own bounding box: as the two stops
 * sweep left → right with scroll, every shape fades in from its own left edge,
 * giving the impression of being drawn. The mask preserves the fill-rule (it's
 * applied after the path renders), so the ink stays clean — no blobs, no
 * centerline artefacts, no hollow outlines.
 *
 * `trail` is the opaque (revealed) back edge, `lead` the transparent front; the
 * FEATHER gap between them is the soft drawing front. Offsets start ≤ 0 (fully
 * hidden) and finish ≥ 1 (fully shown); SVG clamps them to [0, 1].
 */
export function CerradoLineArt({ progress }: { progress: MotionValue<number> }) {
  const trail = useTransform(progress, [REVEAL_START, REVEAL_END], [-FEATHER, 1])
  const lead = useTransform(progress, [REVEAL_START, REVEAL_END], [0, 1 + FEATHER])
  return (
    <svg
      viewBox={CERRADO_VIEWBOX}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
      className={FRAME}
    >
      <defs>
        <linearGradient
          id="cerrado-reveal"
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <motion.stop stopColor="#fff" offset={trail} />
          <motion.stop stopColor="#000" offset={lead} />
        </linearGradient>
        <mask id="cerrado-mask" maskContentUnits="objectBoundingBox">
          <rect x="0" y="0" width="1" height="1" fill="url(#cerrado-reveal)" />
        </mask>
      </defs>
      <g transform={CERRADO_TRANSFORM} fill="#000000" stroke="none">
        {CERRADO_PATHS.map((d, i) => (
          <path key={i} d={d} mask="url(#cerrado-mask)" />
        ))}
      </g>
    </svg>
  )
}
