import { DrawStem } from '../motion/DrawStem'
import { Leaf } from './Leaf'
import { Flower } from './Flower'

interface Props {
  width?: number
  height?: number
  flowerCount?: number
  palette?: string[]
  className?: string
}

const DEFAULT_PALETTE = ['#DC8000', '#DFB100', '#AA9DA9', '#C98262']

// A wavy hand-drawn vine — smooth bezier across the full 800-unit width.
const VINE_D = 'M 10 30 C 110 6 200 54 320 30 S 540 6 660 36 S 770 50 790 28'

// Deterministic leaf positions along the vine. (cy values picked to sit on
// or just beside the vine curve.)
const LEAVES = [
  { cx: 70, cy: 22, rotation: -30, size: 1.2, variant: 1 as const },
  { cx: 150, cy: 38, rotation: 25, size: 1.1, variant: 2 as const },
  { cx: 240, cy: 30, rotation: -20, size: 1.2, variant: 3 as const },
  { cx: 360, cy: 36, rotation: 20, size: 1.1, variant: 4 as const },
  { cx: 470, cy: 22, rotation: -25, size: 1.2, variant: 2 as const },
  { cx: 580, cy: 38, rotation: 30, size: 1.1, variant: 1 as const },
  { cx: 690, cy: 28, rotation: -18, size: 1.2, variant: 3 as const },
  { cx: 760, cy: 34, rotation: 22, size: 1.1, variant: 4 as const },
]

// Anchor positions where flowers are likely to fall along the vine.
const FLOWER_ANCHORS = [
  { cx: 90, cy: 24, variant: 'daisy' as const, size: 0.9 },
  { cx: 200, cy: 38, variant: 'filler' as const, size: 0.9 },
  { cx: 310, cy: 28, variant: 'wild-rose' as const, size: 1 },
  { cx: 420, cy: 34, variant: 'cosmos' as const, size: 0.95 },
  { cx: 540, cy: 22, variant: 'anemone' as const, size: 0.9 },
  { cx: 640, cy: 38, variant: 'daisy' as const, size: 0.95 },
  { cx: 730, cy: 30, variant: 'filler' as const, size: 0.85 },
]

export function VineDivider({
  width = 800,
  height = 60,
  flowerCount = 3,
  palette = DEFAULT_PALETTE,
  className,
}: Props) {
  const clamped = Math.max(0, Math.min(flowerCount, FLOWER_ANCHORS.length))

  // Pick flowers evenly across the anchor list so the count parameter
  // distributes blossoms along the full vine instead of clumping.
  const pickIndices: number[] = []
  if (clamped > 0) {
    const step = FLOWER_ANCHORS.length / clamped
    for (let i = 0; i < clamped; i++) {
      pickIndices.push(Math.min(FLOWER_ANCHORS.length - 1, Math.floor(i * step + step / 2)))
    }
  }

  return (
    <svg
      viewBox="0 0 800 60"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden
    >
      <DrawStem d={VINE_D} stroke="#4E784F" strokeWidth={1.4} duration={2.6} delay={0} />

      {LEAVES.map((leaf, i) => (
        <Leaf
          key={`vine-leaf-${i}`}
          cx={leaf.cx}
          cy={leaf.cy}
          rotation={leaf.rotation}
          size={leaf.size}
          variant={leaf.variant}
          fill={i % 2 === 0 ? '#ADB897' : '#C3CBB2'}
        />
      ))}

      {pickIndices.map((anchorIdx, i) => {
        const anchor = FLOWER_ANCHORS[anchorIdx]
        const color = palette[i % palette.length]
        return (
          <Flower
            key={`vine-flower-${i}`}
            cx={anchor.cx}
            cy={anchor.cy}
            variant={anchor.variant}
            size={anchor.size}
            color={color}
            delay={2.6 + i * 0.4}
          />
        )
      })}
    </svg>
  )
}
