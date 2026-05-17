import { motion, type MotionValue } from 'framer-motion'

interface Props {
  className?: string
  /** Optional motion value for rotation in degrees (e.g. driven by scroll). */
  rotate?: MotionValue<number>
}

/**
 * Big bold geometric daisy/marigold. Six rounded cream petals around a
 * dense amber sun-burst with a small cream eye. Static by default —
 * pass `rotate` to spin it from an external motion value (e.g. scroll
 * progress).
 */
export function Daisy({ className, rotate }: Props) {
  const petals = Array.from({ length: 6 })
  const spikes = Array.from({ length: 48 })

  return (
    <motion.svg
      viewBox="-260 -260 520 520"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      style={rotate ? { rotate } : undefined}
    >
      {petals.map((_, i) => {
        const angle = (i * 360) / petals.length
        return (
          <g key={`p-${i}`} transform={`rotate(${angle})`}>
            <ellipse cx={0} cy={-150} rx={110} ry={130} fill="#FFF4E8" />
          </g>
        )
      })}

      {spikes.map((_, i) => {
        const angle = (i * 360) / spikes.length
        return (
          <g key={`s-${i}`} transform={`rotate(${angle})`}>
            <path d="M -4 -50 L 0 -200 L 4 -50 Z" fill="#D89A35" />
          </g>
        )
      })}

      {spikes.map((_, i) => {
        const angle = (i * 360) / spikes.length + 360 / spikes.length / 2
        return (
          <g key={`d-${i}`} transform={`rotate(${angle})`}>
            <path d="M -2.5 -28 L 0 -90 L 2.5 -28 Z" fill="#3D3229" />
          </g>
        )
      })}

      <circle cx={0} cy={0} r={30} fill="#FFF4E8" />
    </motion.svg>
  )
}
