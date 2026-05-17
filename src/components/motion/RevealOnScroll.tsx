import type { ComponentType, ElementType, ReactNode } from 'react'
import { motion, type HTMLMotionProps, type MotionProps } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

type SupportedTag = 'div' | 'section' | 'article' | 'header' | 'footer' | 'main' | 'aside' | 'span'

interface Props {
  children: ReactNode
  className?: string
  delay?: number
  as?: SupportedTag
}

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  main: motion.main,
  aside: motion.aside,
  span: motion.span,
} satisfies Record<SupportedTag, unknown>

export function RevealOnScroll({ children, className, delay = 0, as = 'div' }: Props) {
  const reduced = useReducedMotion()

  if (reduced) {
    const Tag = as as ElementType
    return <Tag className={className}>{children}</Tag>
  }

  const MotionTag = MOTION_TAGS[as] as ComponentType<HTMLMotionProps<'div'>>
  const motionProps: MotionProps = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay },
  }

  return (
    <MotionTag className={className} {...motionProps}>
      {children}
    </MotionTag>
  )
}
