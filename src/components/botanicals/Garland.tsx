import { DrawStem } from '../motion/DrawStem'
import { Leaf } from './Leaf'
import { Flower } from './Flower'

type Density = 'sparse' | 'medium' | 'lush'

interface Props {
  width?: number
  height?: number
  density?: Density
  palette?: string[]
  animate?: boolean
  className?: string
}

interface LeafPos {
  cx: number
  cy: number
  rotation: number
  size: number
  variant: 1 | 2 | 3 | 4
}

interface FlowerPos {
  cx: number
  cy: number
  size: number
  variant: 'daisy' | 'wild-rose' | 'cosmos' | 'anemone' | 'filler'
  delay: number
}

// Deterministic compositions per density. All coordinates are in a
// normalized 600x200 space and are scaled to the provided width/height.
const LEAVES_SPARSE: LeafPos[] = [
  { cx: 90, cy: 110, rotation: -40, size: 1.4, variant: 1 },
  { cx: 220, cy: 70, rotation: -15, size: 1.5, variant: 2 },
  { cx: 380, cy: 70, rotation: 15, size: 1.5, variant: 3 },
  { cx: 510, cy: 110, rotation: 40, size: 1.4, variant: 4 },
]

const FLOWERS_SPARSE: FlowerPos[] = [
  { cx: 80, cy: 120, size: 1, variant: 'daisy', delay: 0.6 },
  { cx: 300, cy: 50, size: 1.2, variant: 'wild-rose', delay: 0.9 },
  { cx: 520, cy: 120, size: 1, variant: 'cosmos', delay: 1.2 },
]

const LEAVES_MEDIUM: LeafPos[] = [
  { cx: 70, cy: 130, rotation: -50, size: 1.4, variant: 1 },
  { cx: 140, cy: 100, rotation: -30, size: 1.2, variant: 3 },
  { cx: 220, cy: 70, rotation: -10, size: 1.5, variant: 2 },
  { cx: 300, cy: 58, rotation: 5, size: 1.1, variant: 4 },
  { cx: 380, cy: 70, rotation: 15, size: 1.5, variant: 3 },
  { cx: 460, cy: 100, rotation: 30, size: 1.2, variant: 1 },
  { cx: 530, cy: 130, rotation: 50, size: 1.4, variant: 2 },
]

const FLOWERS_MEDIUM: FlowerPos[] = [
  { cx: 60, cy: 140, size: 1, variant: 'daisy', delay: 0.5 },
  { cx: 160, cy: 90, size: 0.9, variant: 'filler', delay: 0.7 },
  { cx: 250, cy: 60, size: 1.1, variant: 'cosmos', delay: 0.9 },
  { cx: 310, cy: 46, size: 1.3, variant: 'wild-rose', delay: 1.1 },
  { cx: 370, cy: 60, size: 1, variant: 'anemone', delay: 1.3 },
  { cx: 450, cy: 90, size: 0.9, variant: 'filler', delay: 1.5 },
  { cx: 540, cy: 140, size: 1, variant: 'daisy', delay: 1.7 },
]

const LEAVES_LUSH: LeafPos[] = [
  ...LEAVES_MEDIUM,
  { cx: 110, cy: 80, rotation: -55, size: 1, variant: 2 },
  { cx: 180, cy: 120, rotation: -20, size: 1, variant: 4 },
  { cx: 260, cy: 90, rotation: -5, size: 0.9, variant: 1 },
  { cx: 340, cy: 90, rotation: 8, size: 0.9, variant: 3 },
  { cx: 420, cy: 120, rotation: 22, size: 1, variant: 2 },
  { cx: 490, cy: 80, rotation: 55, size: 1, variant: 4 },
]

const FLOWERS_LUSH: FlowerPos[] = [
  ...FLOWERS_MEDIUM,
  { cx: 110, cy: 110, size: 0.8, variant: 'filler', delay: 0.6 },
  { cx: 200, cy: 75, size: 0.9, variant: 'anemone', delay: 0.8 },
  { cx: 360, cy: 78, size: 0.9, variant: 'cosmos', delay: 1.2 },
  { cx: 490, cy: 110, size: 0.8, variant: 'filler', delay: 1.4 },
  { cx: 580, cy: 150, size: 0.9, variant: 'wild-rose', delay: 1.8 },
]

const DENSITY_MAP: Record<Density, { leaves: LeafPos[]; flowers: FlowerPos[] }> = {
  sparse: { leaves: LEAVES_SPARSE, flowers: FLOWERS_SPARSE },
  medium: { leaves: LEAVES_MEDIUM, flowers: FLOWERS_MEDIUM },
  lush: { leaves: LEAVES_LUSH, flowers: FLOWERS_LUSH },
}

const DEFAULT_PALETTE = ['#A88A9D', '#C58A7A', '#A88A9D', '#B96F52']

// Two asymmetric overlapping stem arcs to give the garland depth.
const STEM_PRIMARY = 'M 20 160 C 140 -10 320 -10 580 60'
const STEM_SECONDARY = 'M 30 180 C 180 40 360 30 590 120'

export function Garland({
  width = 600,
  height = 200,
  density = 'medium',
  palette = DEFAULT_PALETTE,
  animate = true,
  className,
}: Props) {
  const { leaves, flowers } = DENSITY_MAP[density]

  return (
    <svg
      viewBox="0 0 600 200"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {animate ? (
        <>
          <DrawStem d={STEM_PRIMARY} stroke="#3F5F3D" strokeWidth={1.6} duration={2.6} delay={0} />
          <DrawStem
            d={STEM_SECONDARY}
            stroke="#3F5F3D"
            strokeWidth={1.2}
            duration={2.4}
            delay={0.45}
          />
        </>
      ) : (
        <>
          <path
            d={STEM_PRIMARY}
            stroke="#3F5F3D"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={STEM_SECONDARY}
            stroke="#3F5F3D"
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}

      {leaves.map((leaf, i) => (
        <Leaf
          key={`leaf-${i}`}
          cx={leaf.cx}
          cy={leaf.cy}
          rotation={leaf.rotation}
          size={leaf.size}
          variant={leaf.variant}
          fill={i % 3 === 0 ? '#D0D8B8' : '#B8C2A3'}
        />
      ))}

      {flowers.map((flower, i) => {
        const color = palette[i % palette.length]
        return (
          <Flower
            key={`flower-${i}`}
            cx={flower.cx}
            cy={flower.cy}
            variant={flower.variant}
            size={flower.size}
            color={color}
            animate={animate}
            delay={flower.delay}
          />
        )
      })}
    </svg>
  )
}
