import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

type Direction = 'up' | 'down' | 'left' | 'right'

interface Props {
  children: ReactNode
  direction?: Direction
  delay?: number
  duration?: number
  className?: string
  amount?: number
}

const INITIAL: Record<Direction, string> = {
  up: 'inset(100% 0% 0% 0%)',
  down: 'inset(0% 0% 100% 0%)',
  left: 'inset(0% 0% 0% 100%)',
  right: 'inset(0% 100% 0% 0%)',
}

const REVEALED = 'inset(0% 0% 0% 0%)'

/**
 * Editorial mask reveal. A solid block sweeps off children — useful for
 * text blocks and images that should feel "unveiled" rather than faded.
 * Slower and more deliberate than RevealOnScroll; pairs well with one
 * focal element per section.
 */
export function MaskReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 1.4,
  className,
  amount = 0.3,
}: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ clipPath: INITIAL[direction] }}
      whileInView={{ clipPath: REVEALED }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}
