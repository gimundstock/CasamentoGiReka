import { Bloom } from '../motion/Bloom'

type Variant = 'daisy' | 'wild-rose' | 'cosmos' | 'anemone' | 'filler'

interface Props {
  cx: number
  cy: number
  variant?: Variant
  size?: number
  color?: string
  centerColor?: string
  animate?: boolean
  delay?: number
  className?: string
}

// Deterministic asymmetric petal angles per-variant. Spacing is
// intentionally uneven so the flower never feels mechanical.
const PETAL_ANGLES_DAISY = [-12, 60, 128, 195, 255, 318]
const PETAL_ANGLES_ROSE = [0, 72, 148, 220, 292]
const PETAL_ANGLES_COSMOS = [-6, 38, 84, 130, 178, 222, 268, 314]
const PETAL_ANGLES_ANEMONE = [-10, 52, 118, 184, 244, 308]
const PETAL_ANGLES_FILLER = [0, 90, 180, 270]

// Each petal path begins at 0,0 (the flower center) and extends outward.
const PETAL_PATH_DAISY = 'M 0 0 C 1.5 -5 2 -12 0 -16 C -2 -12 -1.5 -5 0 0 Z'
const PETAL_PATH_ROSE = 'M 0 0 C 4 -3 7 -8 4 -13 C 0 -16 -4 -13 -4 -8 C -4 -4 -2 -1 0 0 Z'
const PETAL_PATH_COSMOS = 'M 0 0 C 1.5 -6 1 -14 0 -18 C -1 -14 -1.5 -6 0 0 Z'
const PETAL_PATH_ANEMONE = 'M 0 0 C 3 -4 5 -10 3 -15 C 0 -17 -3 -15 -3 -10 C -3 -5 -1.5 -2 0 0 Z'
const PETAL_PATH_FILLER = 'M 0 0 C 1 -2 1.2 -5 0 -6.5 C -1.2 -5 -1 -2 0 0 Z'

function renderPetals(angles: number[], d: string, color: string, opacity: number, size: number) {
  return angles.map((angle, i) => (
    <path
      key={i}
      d={d}
      fill={color}
      opacity={opacity}
      transform={`rotate(${angle}) scale(${size})`}
    />
  ))
}

function FlowerBody({
  variant,
  size,
  color,
  centerColor,
}: {
  variant: Variant
  size: number
  color: string
  centerColor: string
}) {
  if (variant === 'wild-rose') {
    return (
      <>
        {renderPetals(PETAL_ANGLES_ROSE, PETAL_PATH_ROSE, color, 0.85, size)}
        <circle r={3.5 * size} fill={centerColor} />
        <circle r={1.6 * size} fill={color} opacity={0.55} />
      </>
    )
  }

  if (variant === 'cosmos') {
    return (
      <>
        {renderPetals(PETAL_ANGLES_COSMOS, PETAL_PATH_COSMOS, color, 0.9, size)}
        <circle r={2.4 * size} fill={centerColor} />
      </>
    )
  }

  if (variant === 'anemone') {
    return (
      <>
        {renderPetals(PETAL_ANGLES_ANEMONE, PETAL_PATH_ANEMONE, color, 0.85, size)}
        {renderPetals(PETAL_ANGLES_ANEMONE, PETAL_PATH_ANEMONE, color, 0.55, size * 0.7)}
        <circle r={2 * size} fill="#3F2A1A" opacity={0.85} />
      </>
    )
  }

  if (variant === 'filler') {
    return (
      <>
        {renderPetals(PETAL_ANGLES_FILLER, PETAL_PATH_FILLER, color, 0.9, size)}
        <circle r={0.9 * size} fill={centerColor} />
      </>
    )
  }

  // daisy (default)
  return (
    <>
      {renderPetals(PETAL_ANGLES_DAISY, PETAL_PATH_DAISY, color, 0.9, size)}
      <circle r={4 * size} fill={centerColor} />
      <circle r={1.8 * size} fill="#A86F00" opacity={0.45} />
    </>
  )
}

export function Flower({
  cx,
  cy,
  variant = 'daisy',
  size = 1,
  color = '#A88A9D',
  centerColor = '#C58A7A',
  animate = true,
  delay = 0,
  className,
}: Props) {
  const body = <FlowerBody variant={variant} size={size} color={color} centerColor={centerColor} />

  if (!animate) {
    return (
      <g transform={`translate(${cx} ${cy})`} className={className} aria-hidden>
        {body}
      </g>
    )
  }

  return (
    <g transform={`translate(${cx} ${cy})`} className={className} aria-hidden>
      <Bloom delay={delay}>{body}</Bloom>
    </g>
  )
}
