import { useRef } from 'react'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { DESK, ease, seg } from '../passport/geometry'
import { ManualCard, type ManualCardHandle } from './ManualCard'
import type { ManualPush } from './geometry'

/** How much of the push the manual takes to arrive (as the envelope's, DESK). */
export const ARRIVE_SHARE = (DESK.arrive[1] - DESK.shove[0]) / (DESK.shove[1] - DESK.shove[0])

/**
 * The padrinhos' manual, shut, drawn in from the right over the RSVP's
 * last screen (`leaving`, 0 → 1), pushing the reply card off to the left:
 * it comes to rest where the manual's own section (PadrinhosSection) has
 * it, which then takes over unseen.
 */
export function ManualArriving({
  push,
  leaving,
  vw,
}: {
  push: ManualPush
  leaving: MotionValue<number>
  vw: number
}) {
  const handle = useRef<ManualCardHandle>(null)
  const { w, h, y, radius } = push.size
  const drawn = useTransform(leaving, (v) => ease(seg(v, [0, ARRIVE_SHARE])))
  const x = useTransform(drawn, (d) => push.from * (1 - d))
  const rotate = useTransform(drawn, (d) => 5 * (1 - d))
  const visibility = useTransform(leaving, (v) => (v > 0 ? 'visible' : 'hidden'))
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: vw / 2 - w,
        top: y - h / 2,
        width: 2 * w,
        height: h,
        x,
        rotate,
        visibility,
        zIndex: 8,
      }}
    >
      <ManualCard w={w} h={h} radius={radius} handle={handle} />
    </motion.div>
  )
}
