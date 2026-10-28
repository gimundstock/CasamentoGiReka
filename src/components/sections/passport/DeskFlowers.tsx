import type { CSSProperties, Ref } from 'react'
import type { DeskLayout, PassportGeometry } from './geometry'
import { NAV_HEIGHT as NAV_H } from '../Envelope'

/**
 * The wildflowers lying round the passport and the envelope on the desk —
 * the Save the Date's falling ones (public/flowers/falling), come to rest.
 * Where (fractions of a box round the two of them: below 0 or above 1 is
 * outside it), turned how far, and at what size. Most lie out towards the
 * screen's margins; the `near` ones close by, at the two's very edges.
 */
const FLOWER_BED: {
  src: string
  x: number
  y: number
  rot: number
  s?: number
  near?: boolean
}[] = [
  { src: 'flower_02', x: -0.05, y: 0.12, rot: -32 },
  { src: 'flower_06', x: -0.06, y: 0.86, rot: 24 },
  { src: 'flower_00', x: 0.24, y: -0.09, rot: -14 },
  { src: 'flower_05', x: 0.6, y: -0.08, rot: 62 },
  { src: 'flower_11', x: 1.04, y: 0.14, rot: 22 },
  { src: 'flower_13', x: 1.05, y: 0.84, rot: -38 },
  { src: 'flower_04', x: 0.36, y: 1.08, rot: 78 },
  { src: 'flower_03', x: 0.76, y: 1.07, rot: 96 },
  { src: 'flower_01', x: 0.12, y: 1.09, rot: 10 },
  { src: 'flower_07', x: 0.93, y: -0.07, rot: -20 },
  { src: 'flower_12', x: 1.09, y: 0.5, rot: 35 },
  { src: 'petal_00', x: 0.04, y: -0.07, rot: 30 },
  { src: 'petal_03', x: 0.44, y: -0.05, rot: -60 },
  { src: 'petal_05', x: 0.86, y: 1.1, rot: 15 },
  { src: 'petal_07', x: -0.08, y: 0.48, rot: 80 },
  { src: 'petal_02', x: 0.55, y: 1.12, rot: -25 },
  { src: 'petal_08', x: 1.07, y: 0.33, rot: 50 },
  { src: 'petal_09', x: 0.21, y: 1.13, rot: -70 },
  { src: 'petal_04', x: 0.82, y: -0.1, rot: 110 },
  // Close by.
  { src: 'flower_08', x: -0.035, y: 0.3, rot: -18, near: true },
  { src: 'flower_09', x: 0.5, y: 0.02, rot: 28, near: true },
  { src: 'flower_10', x: 1.02, y: 0.62, rot: -12, near: true },
  { src: 'flower_00', x: 0.3, y: 1.05, rot: 52, near: true },
  { src: 'flower_12', x: 0.64, y: 1.03, rot: -30, near: true },
  { src: 'flower_07', x: 0.82, y: 0.06, rot: 14, near: true },
  { src: 'flower_01', x: -0.03, y: 1.0, rot: -40, near: true },
  { src: 'petal_01', x: 0.16, y: -0.035, rot: 40, near: true },
  { src: 'petal_06', x: 0.99, y: 0.04, rot: -35, near: true },
  { src: 'petal_05', x: 0.44, y: 1.06, rot: 70, near: true },
  { src: 'petal_03', x: 1.035, y: 0.9, rot: 15, near: true },
  { src: 'petal_09', x: -0.045, y: 0.66, rot: -55, near: true },
  { src: 'petal_07', x: 0.6, y: 0.08, rot: 100, near: true },
]
const FLOWERS_BASE = `${import.meta.env.BASE_URL}flowers/falling`

/**
 * The wildflowers on the desk, laid out round the passport and the envelope
 * where they lie (deskLayout), out towards the screen's margins. Drawn small: the cut-outs are small images.
 * The passport's stage and the invitation (RSVP) both draw them, in the
 * same place, so they stay put across the hand-over.
 */
export function DeskFlowers({
  g,
  desk,
  divRef,
  style,
}: {
  g: PassportGeometry
  desk: DeskLayout
  divRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}) {
  const P = desk.passport
  const E = desk.envelope
  const pw = (P.s * g.coverBox.w) / 2
  const ph = (P.s * g.coverBox.h) / 2
  const ex = g.vw / 2 + E.x
  const ey = g.vh / 2 + E.y
  const ew = (E.s * desk.env.ew) / 2
  const eh = (E.s * desk.env.eh) / 2
  // The box round the two (`near`), and the same reaching halfway out to
  // the screen's margins.
  const box = {
    x0: Math.min(P.x - pw, ex - ew),
    x1: Math.max(P.x + pw, ex + ew),
    y0: Math.min(P.y - ph, ey - eh),
    y1: Math.max(P.y + ph, ey + eh),
  }
  const out = (a: number, edge: number) => a + (edge - a) * 0.55
  const wide = {
    x0: out(box.x0, g.vw * 0.03),
    x1: out(box.x1, g.vw * 0.97),
    y0: out(box.y0, NAV_H + 24),
    y1: out(box.y1, g.vh - 24),
  }
  const k = Math.min(0.75, Math.max(0.55, g.vw / 2200))
  return (
    <div ref={divRef} aria-hidden className="pointer-events-none absolute inset-0" style={style}>
      {FLOWER_BED.map((f, i) => {
        const b = f.near ? box : wide
        return (
          <img
            key={i}
            src={`${FLOWERS_BASE}/${f.src}.webp`}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none"
            style={{
              left: b.x0 + (b.x1 - b.x0) * f.x,
              top: b.y0 + (b.y1 - b.y0) * f.y,
              transform: `translate(-50%, -50%) rotate(${f.rot}deg) scale(${k * (f.s ?? 1)})`,
            }}
          />
        )
      })}
    </div>
  )
}
