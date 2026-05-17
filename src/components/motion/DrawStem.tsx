import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  d: string
  stroke?: string
  strokeWidth?: number
  duration?: number
  delay?: number
  className?: string
}

export function DrawStem({
  d,
  stroke = '#4E784F',
  strokeWidth = 1.6,
  duration = 2.4,
  delay = 0,
  className,
}: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        className={className}
      />
    )
  }

  return (
    <motion.path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
      className={className}
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}
