import { useId } from 'react'
import { DrawStem } from '../motion/DrawStem'
import { Bloom } from '../motion/Bloom'
import { Leaf } from './Leaf'
import { Flower } from './Flower'

interface Props {
  imageSrc: string
  imageAlt: string
  width?: number
  height?: number
  palette?: string[]
  animate?: boolean
  className?: string
}

const DEFAULT_PALETTE = ['#DC8000', '#DFB100', '#AA9DA9', '#C98262', '#DC9A32']

// Asymmetric garland stems above the arch — three overlapping arcs drawn
// with staggered delays for a hand-painted, layered feel.
const GARLAND_STEM_1 = 'M 40 210 C 160 60 320 30 560 170'
const GARLAND_STEM_2 = 'M 60 220 C 180 80 360 50 540 200'
const GARLAND_STEM_3 = 'M 80 200 C 220 100 380 80 520 180'

// Trailing stems down each shoulder — intentionally different shapes.
const LEFT_TRAIL_1 = 'M 48 202 C 26 252 16 300 22 340'
const LEFT_TRAIL_2 = 'M 42 240 C 18 290 8 340 18 380'
const RIGHT_TRAIL_1 = 'M 552 202 C 576 248 590 296 572 332'
const RIGHT_TRAIL_2 = 'M 558 246 C 590 296 600 348 580 386'

interface LeafSpec {
  cx: number
  cy: number
  rotation: number
  size: number
  variant: 1 | 2 | 3 | 4
  delay: number
  fill?: string
}

interface FlowerSpec {
  cx: number
  cy: number
  variant: 'daisy' | 'wild-rose' | 'cosmos' | 'anemone' | 'filler'
  size: number
  colorIdx: number
  delay: number
}

// Leaves along the top garland — distributed across the arch crown.
const TOP_LEAVES: LeafSpec[] = [
  { cx: 100, cy: 130, rotation: -45, size: 1.5, variant: 1, delay: 1.2 },
  { cx: 165, cy: 90, rotation: -25, size: 1.4, variant: 2, delay: 1.3 },
  { cx: 240, cy: 60, rotation: -10, size: 1.3, variant: 3, delay: 1.35 },
  { cx: 310, cy: 50, rotation: 4, size: 1.2, variant: 4, delay: 1.4 },
  { cx: 380, cy: 60, rotation: 14, size: 1.3, variant: 1, delay: 1.45 },
  { cx: 450, cy: 95, rotation: 30, size: 1.4, variant: 2, delay: 1.5 },
  { cx: 510, cy: 135, rotation: 48, size: 1.5, variant: 3, delay: 1.55 },
]

const SHOULDER_LEAVES: LeafSpec[] = [
  { cx: 22, cy: 268, rotation: -60, size: 1.2, variant: 2, delay: 1.6, fill: '#C3CBB2' },
  { cx: 18, cy: 320, rotation: -50, size: 1.2, variant: 4, delay: 1.65 },
  { cx: 14, cy: 366, rotation: -40, size: 1.1, variant: 1, delay: 1.7 },
  { cx: 578, cy: 268, rotation: 60, size: 1.2, variant: 3, delay: 1.6, fill: '#C3CBB2' },
  { cx: 582, cy: 322, rotation: 50, size: 1.2, variant: 1, delay: 1.7 },
  { cx: 586, cy: 372, rotation: 40, size: 1.1, variant: 2, delay: 1.75 },
]

// Top garland flowers — asymmetric (right shoulder will get +1).
const TOP_FLOWERS: FlowerSpec[] = [
  { cx: 90, cy: 138, variant: 'cosmos', size: 1, colorIdx: 1, delay: 1.8 },
  { cx: 140, cy: 100, variant: 'filler', size: 0.9, colorIdx: 2, delay: 1.9 },
  { cx: 200, cy: 70, variant: 'daisy', size: 1.1, colorIdx: 0, delay: 2.0 },
  { cx: 268, cy: 50, variant: 'wild-rose', size: 1.2, colorIdx: 4, delay: 2.1 },
  { cx: 308, cy: 38, variant: 'anemone', size: 1.1, colorIdx: 2, delay: 2.2 },
  { cx: 348, cy: 50, variant: 'daisy', size: 1.1, colorIdx: 1, delay: 2.3 },
  { cx: 408, cy: 70, variant: 'cosmos', size: 1, colorIdx: 0, delay: 2.4 },
  { cx: 468, cy: 100, variant: 'wild-rose', size: 1.1, colorIdx: 3, delay: 2.5 },
  { cx: 520, cy: 138, variant: 'daisy', size: 1, colorIdx: 1, delay: 2.6 },
  // extra blossom on the right shoulder for asymmetry
  { cx: 488, cy: 78, variant: 'filler', size: 0.85, colorIdx: 2, delay: 2.65 },
]

const SHOULDER_FLOWERS: FlowerSpec[] = [
  { cx: 30, cy: 252, variant: 'daisy', size: 0.95, colorIdx: 0, delay: 2.4 },
  { cx: 20, cy: 350, variant: 'cosmos', size: 0.9, colorIdx: 2, delay: 2.7 },
  { cx: 568, cy: 248, variant: 'wild-rose', size: 1, colorIdx: 1, delay: 2.5 },
  { cx: 576, cy: 320, variant: 'anemone', size: 0.95, colorIdx: 3, delay: 2.7 },
  { cx: 584, cy: 388, variant: 'daisy', size: 0.9, colorIdx: 0, delay: 2.9 },
]

export function ArchMask({
  imageSrc,
  imageAlt,
  width = 600,
  height = 420,
  palette = DEFAULT_PALETTE,
  animate = true,
  className,
}: Props) {
  const rawId = useId()
  const clipId = `arch-mask-clip-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`
  const archPath = 'M 50 400 L 50 200 A 250 120 0 0 1 550 200 L 550 400 Z'
  const archStroke = 'M 50 400 L 50 200 A 250 120 0 0 1 550 200 L 550 400'

  const renderStem = (d: string, stroke: string, sw: number, delay: number, duration: number) =>
    animate ? (
      <DrawStem d={d} stroke={stroke} strokeWidth={sw} delay={delay} duration={duration} />
    ) : (
      <path d={d} stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
    )

  const renderBloomed = (key: string, delay: number, children: React.ReactNode) =>
    animate ? (
      <Bloom key={key} delay={delay}>
        {children}
      </Bloom>
    ) : (
      <g key={key}>{children}</g>
    )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={imageAlt}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={archPath} />
        </clipPath>
      </defs>

      {/* Soft watercolor wash behind the arch */}
      <ellipse cx={300} cy={210} rx={300} ry={170} fill="#ADB897" opacity={0.18} />
      <ellipse cx={310} cy={230} rx={250} ry={140} fill="#C3CBB2" opacity={0.22} />

      {/* Ground shadow */}
      <ellipse cx={300} cy={410} rx={260} ry={5} fill="#4E784F" opacity={0.16} />

      {/* Sage fallback behind the photo */}
      <path d={archPath} fill="#ADB897" opacity={0.22} />

      {/* Photo clipped to the arch silhouette */}
      <image
        href={imageSrc}
        x={50}
        y={80}
        width={500}
        height={320}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* Soft arch outline */}
      <path d={archStroke} stroke="#4E784F" strokeWidth={1.4} fill="none" opacity={0.32} />

      {/* Top garland — three overlapping stems drawn sequentially */}
      {renderStem(GARLAND_STEM_1, '#4E784F', 1.4, 0, 2.4)}
      {renderStem(GARLAND_STEM_2, '#3F6041', 1.2, 0.4, 2.4)}
      {renderStem(GARLAND_STEM_3, '#4E784F', 1.1, 0.8, 2.2)}

      {/* Trailing shoulder stems */}
      {renderStem(LEFT_TRAIL_1, '#4E784F', 1.3, 1.0, 2.2)}
      {renderStem(LEFT_TRAIL_2, '#3F6041', 1.1, 1.15, 2.2)}
      {renderStem(RIGHT_TRAIL_1, '#4E784F', 1.3, 1.05, 2.2)}
      {renderStem(RIGHT_TRAIL_2, '#3F6041', 1.1, 1.2, 2.2)}

      {/* Leaves */}
      {TOP_LEAVES.map((leaf, i) =>
        renderBloomed(
          `top-leaf-${i}`,
          leaf.delay,
          <Leaf
            cx={leaf.cx}
            cy={leaf.cy}
            rotation={leaf.rotation}
            size={leaf.size}
            variant={leaf.variant}
            fill={leaf.fill ?? '#ADB897'}
          />
        )
      )}
      {SHOULDER_LEAVES.map((leaf, i) =>
        renderBloomed(
          `shoulder-leaf-${i}`,
          leaf.delay,
          <Leaf
            cx={leaf.cx}
            cy={leaf.cy}
            rotation={leaf.rotation}
            size={leaf.size}
            variant={leaf.variant}
            fill={leaf.fill ?? '#ADB897'}
          />
        )
      )}

      {/* Flowers — Flower component already handles its own Bloom; pass animate. */}
      {TOP_FLOWERS.map((f, i) => (
        <Flower
          key={`top-flower-${i}`}
          cx={f.cx}
          cy={f.cy}
          variant={f.variant}
          size={f.size}
          color={palette[f.colorIdx % palette.length]}
          delay={f.delay}
          animate={animate}
        />
      ))}
      {SHOULDER_FLOWERS.map((f, i) => (
        <Flower
          key={`shoulder-flower-${i}`}
          cx={f.cx}
          cy={f.cy}
          variant={f.variant}
          size={f.size}
          color={palette[f.colorIdx % palette.length]}
          delay={f.delay}
          animate={animate}
        />
      ))}
    </svg>
  )
}
