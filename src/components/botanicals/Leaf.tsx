interface Props {
  cx: number
  cy: number
  rotation?: number
  size?: number
  variant?: 1 | 2 | 3 | 4
  fill?: string
  className?: string
}

// Four slightly different organic leaf silhouettes. Each is a small
// teardrop/almond drawn with bezier curves anchored at 0,0.
const LEAF_PATHS: Record<1 | 2 | 3 | 4, string> = {
  // classic almond
  1: 'M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z',
  // slimmer, pointier
  2: 'M 0 0 C 4 -4 11 -7 16 -2 C 17 3 11 6 5 5 C 1 4 -1 2 0 0 Z',
  // curled tip
  3: 'M 0 0 C 2 -6 10 -7 15 -4 C 18 0 14 4 8 5 C 3 6 -1 4 0 0 Z',
  // fuller, rounder
  4: 'M 0 0 C 3 -6 10 -5 13 -1 C 15 4 9 6 5 5 C 1 5 -1 3 0 0 Z',
}

// Subtle midrib that gives the leaf a hand-drawn quality.
const LEAF_VEIN: Record<1 | 2 | 3 | 4, string> = {
  1: 'M 1 1 Q 7 0 13 -2',
  2: 'M 1 1 Q 8 0 15 -1',
  3: 'M 1 1 Q 7 0 14 -3',
  4: 'M 1 1 Q 6 0 12 -1',
}

export function Leaf({
  cx,
  cy,
  rotation = 0,
  size = 1,
  variant = 1,
  fill = '#ADB897',
  className,
}: Props) {
  return (
    <g
      transform={`translate(${cx} ${cy}) rotate(${rotation}) scale(${size})`}
      className={className}
      aria-hidden
    >
      <path d={LEAF_PATHS[variant]} fill={fill} />
      <path
        d={LEAF_VEIN[variant]}
        stroke="#3F6041"
        strokeWidth={0.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
    </g>
  )
}
