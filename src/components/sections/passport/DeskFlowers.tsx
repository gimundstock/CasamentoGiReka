import type { CSSProperties, Ref } from 'react'
import type { DeskLayout, PassportGeometry } from './geometry'
import { NAV_HEIGHT as NAV_H } from '../Envelope'

/**
 * The wildflowers lying round the passport and the envelope on the desk —
 * the Save the Date's falling ones (public/flowers/falling), come to rest.
 * Where (fractions of the box round the two of them: below 0 or above 1 is
 * outside it), turned how far, and at what size.
 */
const FLOWER_BED: { src: string; x: number; y: number; rot: number; s?: number }[] = [
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
  // The box round the two, reaching halfway out to the screen's margins.
  const out = (a: number, edge: number) => a + (edge - a) * 0.55
  const x0 = out(Math.min(P.x - pw, ex - ew), g.vw * 0.03)
  const x1 = out(Math.max(P.x + pw, ex + ew), g.vw * 0.97)
  const y0 = out(Math.min(P.y - ph, ey - eh), NAV_H + 24)
  const y1 = out(Math.max(P.y + ph, ey + eh), g.vh - 24)
  const k = Math.min(0.75, Math.max(0.55, g.vw / 2200))
  return (
    <div ref={divRef} aria-hidden className="pointer-events-none absolute inset-0" style={style}>
      {FLOWER_BED.map((f) => (
        <img
          key={f.src}
          src={`${FLOWERS_BASE}/${f.src}.webp`}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            left: x0 + (x1 - x0) * f.x,
            top: y0 + (y1 - y0) * f.y,
            transform: `translate(-50%, -50%) rotate(${f.rot}deg) scale(${k * (f.s ?? 1)})`,
          }}
        />
      ))}
    </div>
  )
}
