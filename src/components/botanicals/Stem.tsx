import { DrawStem } from '../motion/DrawStem'

interface Props {
  d?: string
  variant?: 1 | 2 | 3 | 4
  stroke?: string
  strokeWidth?: number
  animate?: boolean
  delay?: number
  duration?: number
  className?: string
}

// Four deterministic, slightly imperfect curving stems. Coordinates assume
// the stem starts near the origin and curves up/over to about 100 units away.
const STEM_PATHS: Record<1 | 2 | 3 | 4, string> = {
  1: 'M 0 100 C 6 78 -4 52 8 30 S 22 6 30 -6',
  2: 'M 0 100 C -8 74 14 56 4 32 S -10 8 -2 -10',
  3: 'M 0 100 C 12 80 -2 60 16 38 S 28 14 22 -8',
  4: 'M 0 100 C -4 76 8 54 -2 30 S 14 10 6 -12',
}

export function Stem({
  d,
  variant = 1,
  stroke = '#3F5F3D',
  strokeWidth = 1.5,
  animate = true,
  delay = 0,
  duration = 2.4,
  className,
}: Props) {
  const path = d ?? STEM_PATHS[variant]

  if (!animate) {
    return (
      <path
        d={path}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        className={className}
        aria-hidden
      />
    )
  }

  return (
    <DrawStem
      d={path}
      stroke={stroke}
      strokeWidth={strokeWidth}
      delay={delay}
      duration={duration}
      className={className}
    />
  )
}
