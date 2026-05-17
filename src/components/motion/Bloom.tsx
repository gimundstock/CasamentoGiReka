import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  children: ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function Bloom({ children, delay = 0, duration = 1, className }: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <g className={className}>{children}</g>
  }

  return (
    <motion.g
      className={className}
      initial={{ scale: 0.3, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: 'spring', stiffness: 60, damping: 12, delay, duration }}
      style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
    >
      {children}
    </motion.g>
  )
}
