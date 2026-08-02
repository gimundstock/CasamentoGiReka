import { motion, useTransform, type MotionValue } from 'framer-motion'
import { useReducedMotion } from '../motion/useReducedMotion'

/**
 * Brasília drawn on as you scroll — Catedral Metropolitana on the left, the
 * Congresso Nacional on the right, an ipê branch framing them from the
 * foreground.
 *
 * Unlike `CerradoLineArt`, this art is authored as REAL strokes (`fill="none"`
 * + `stroke`), not autotraced fill-rule rings, so the honest `pathLength`
 * draw-on works directly — no per-path gradient mask needed.
 *
 * Geometry lives in view units of VIEWBOX. The ground line at GROUND_Y is the
 * shared baseline: both monuments sit on it, the branch crosses it.
 */

const VIEWBOX = '0 0 440 560'
const GROUND_Y = 430

// ── Catedral ───────────────────────────────────────────────
// The 16 hyperboloid ribs read as 9 in elevation. They are spaced by equal
// ANGLE around the base circle, so `t = sin(angle)` — which bunches them
// towards the outer edges exactly as the real building does. Spacing them
// evenly instead makes the silhouette read as a pleated skirt.
const CATHEDRAL_CX = 132
const CATHEDRAL_HALF = 80
const RIB_TS = [-90, -60, -30, 0, 30, 60, 90].map((deg) => Math.sin((deg * Math.PI) / 180))

// Rib profile in `u` — the fraction of the base half-width at a given height.
// The throat is deliberately WIDE (u = 0.45, at ~60 % height) and the tips
// splay back out to u = 0.72. A tighter throat bunches the nine ribs into a
// dense bundle and the silhouette reads as a pleated skirt; keeping the crown
// open is what makes it read as the cathedral. At t = 0 this collapses to the
// straight, front-facing rib.
function rib(t: number): string {
  const x = (u: number) => (CATHEDRAL_CX + t * CATHEDRAL_HALF * u).toFixed(1)
  return (
    `M ${x(1)} ${GROUND_Y} ` +
    `C ${x(0.97)} 400 ${x(0.88)} 362 ${x(0.7)} 316 ` +
    `C ${x(0.58)} 286 ${x(0.46)} 262 ${x(0.45)} 250 ` +
    `C ${x(0.46)} 228 ${x(0.58)} 206 ${x(0.72)} 190`
  )
}

// The tension ring tying the ribs at the throat, and the circular podium —
// both seen edge-on, so both sag towards the viewer.
const CATHEDRAL_RING = `M 96 252 Q 132 260 168 252`
const CATHEDRAL_PODIUM = `M 46 ${GROUND_Y} Q 132 442 218 ${GROUND_Y}`

// ── Congresso Nacional ─────────────────────────────────────
// Low horizontal slab, the Câmara's upturned bowl on the left, the Senado's
// dome on the right, twin secretariat towers between them. Arc sweep 1 bulges
// up (dome), sweep 0 bulges down (bowl opening skyward).
const SLAB_TOP = 406
const CONGRESSO = {
  slab: `M 214 ${GROUND_Y} L 214 ${SLAB_TOP} L 428 ${SLAB_TOP} L 428 ${GROUND_Y}`,
  bowl: `M 219 ${SLAB_TOP} A 31 20 0 0 0 281 ${SLAB_TOP}`,
  dome: `M 361 ${SLAB_TOP} A 31 20 0 0 1 423 ${SLAB_TOP}`,
  towerL: `M 303 ${SLAB_TOP} L 303 280 L 315 280 L 315 ${SLAB_TOP}`,
  towerR: `M 327 ${SLAB_TOP} L 327 280 L 339 280 L 339 ${SLAB_TOP}`,
  link: `M 315 350 L 327 350`,
}

// Not dead straight — a drawn horizon, not a ruled one.
const HORIZON = `M 0 431 C 110 428 250 433 440 429`

// ── Ipê branch ─────────────────────────────────────────────
// Foreground layer, kept in the band BELOW the horizon so it frames the
// monuments instead of slicing through them. Sprigs reach up towards the
// skyline; the blossoms sit at their tips.
const BRANCH = {
  main: `M -10 552 C 60 536 118 512 176 486 C 224 464 274 452 322 448`,
  sprigL: `M 96 522 C 92 496 96 470 108 448`,
  sprigM: `M 208 474 C 214 452 226 434 244 422`,
  sprigR: `M 292 454 C 306 438 322 428 340 424`,
}

// Ipê blossoms — amber, clustered at the sprig tips, a few drifting up the
// left margin.
const BLOSSOMS: Array<{ cx: number; cy: number; r: number }> = [
  { cx: 108, cy: 448, r: 5 },
  { cx: 99, cy: 470, r: 4 },
  { cx: 118, cy: 462, r: 3.5 },
  { cx: 244, cy: 422, r: 5.5 },
  { cx: 234, cy: 440, r: 4 },
  { cx: 254, cy: 438, r: 3.5 },
  { cx: 340, cy: 424, r: 5 },
  { cx: 326, cy: 436, r: 4 },
  { cx: 176, cy: 486, r: 4.5 },
  { cx: 60, cy: 536, r: 4 },
  { cx: 30, cy: 545, r: 3.5 },
  { cx: 44, cy: 392, r: 4 },
  { cx: 62, cy: 352, r: 3.5 },
  { cx: 30, cy: 316, r: 3 },
]

// ── Reveal choreography ────────────────────────────────────
// Strokes draw in narrative order (ground → cathedral → congresso → branch),
// each over a window of DRAW_SPAN, staggered so consecutive strokes overlap
// rather than drawing one-at-a-time.
const DRAW_START = 0.05
const DRAW_END = 0.88
const DRAW_SPAN = 0.22
const BLOOM_START = 0.55
const BLOOM_END = 0.95
const BLOOM_SPAN = 0.16

type Stroke = { d: string; stroke: string; width: number; opacity: number }

const INK = '#3D3229' // forest-deep — architecture
const WOOD = '#7A6758' // forest — the branch
const PETAL = '#D89A35' // amber — ipê blossoms

const STROKES: Stroke[] = [
  { d: HORIZON, stroke: INK, width: 1, opacity: 0.3 },
  ...RIB_TS.map((t) => ({ d: rib(t), stroke: INK, width: 1.3, opacity: 0.65 })),
  { d: CATHEDRAL_RING, stroke: INK, width: 1, opacity: 0.45 },
  { d: CATHEDRAL_PODIUM, stroke: INK, width: 1, opacity: 0.4 },
  { d: CONGRESSO.slab, stroke: INK, width: 1.3, opacity: 0.65 },
  { d: CONGRESSO.bowl, stroke: INK, width: 1.3, opacity: 0.65 },
  { d: CONGRESSO.dome, stroke: INK, width: 1.3, opacity: 0.65 },
  { d: CONGRESSO.towerL, stroke: INK, width: 1.3, opacity: 0.65 },
  { d: CONGRESSO.towerR, stroke: INK, width: 1.3, opacity: 0.65 },
  { d: CONGRESSO.link, stroke: INK, width: 1, opacity: 0.5 },
  { d: BRANCH.main, stroke: WOOD, width: 1.6, opacity: 0.75 },
  { d: BRANCH.sprigL, stroke: WOOD, width: 1.2, opacity: 0.65 },
  { d: BRANCH.sprigM, stroke: WOOD, width: 1.2, opacity: 0.65 },
  { d: BRANCH.sprigR, stroke: WOOD, width: 1.2, opacity: 0.65 },
]

/**
 * The [from, to] progress window for item `i`: an even stagger across
 * [start, end], leaving room for the last item's span. NOT named `window` —
 * that shadows the global at module scope and breaks the React refresh
 * preamble check.
 */
function stagger(i: number, count: number, start: number, end: number, span: number) {
  const step = count > 1 ? (end - start - span) / (count - 1) : 0
  const from = start + i * step
  return [from, from + span] as const
}

function DrawnStroke({
  progress,
  stroke,
  index,
}: {
  progress: MotionValue<number>
  stroke: Stroke
  index: number
}) {
  const [from, to] = stagger(index, STROKES.length, DRAW_START, DRAW_END, DRAW_SPAN)
  const pathLength = useTransform(progress, [from, to], [0, 1], { clamp: true })
  return (
    <motion.path
      d={stroke.d}
      fill="none"
      stroke={stroke.stroke}
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={stroke.opacity}
      style={{ pathLength }}
    />
  )
}

function Blossom({
  progress,
  blossom,
  index,
  count,
}: {
  progress: MotionValue<number>
  blossom: (typeof BLOSSOMS)[number]
  index: number
  count: number
}) {
  const [from, to] = stagger(index, count, BLOOM_START, BLOOM_END, BLOOM_SPAN)
  const opacity = useTransform(progress, [from, to], [0, 0.85], { clamp: true })
  const scale = useTransform(progress, [from, to], [0.2, 1], { clamp: true })
  return (
    <motion.g style={{ opacity, scale, transformBox: 'fill-box', transformOrigin: 'center' }}>
      <circle cx={blossom.cx} cy={blossom.cy} r={blossom.r} fill={PETAL} />
    </motion.g>
  )
}

export function BrasiliaLineArt({ progress }: { progress: MotionValue<number> }) {
  const reduced = useReducedMotion()

  return (
    <svg
      viewBox={VIEWBOX}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto select-none overflow-visible"
    >
      {reduced
        ? STROKES.map((s, i) => (
            <path
              key={i}
              d={s.d}
              fill="none"
              stroke={s.stroke}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={s.opacity}
            />
          ))
        : STROKES.map((s, i) => <DrawnStroke key={i} progress={progress} stroke={s} index={i} />)}

      {BLOSSOMS.map((b, i) =>
        reduced ? (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={PETAL} opacity={0.85} />
        ) : (
          <Blossom key={i} progress={progress} blossom={b} index={i} count={BLOSSOMS.length} />
        )
      )}
    </svg>
  )
}
