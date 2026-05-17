import { useId } from 'react'

interface Props {
  imageSrc: string
  imageAlt: string
  width?: number
  height?: number
  className?: string
}

// Deterministic jitter amounts (px) applied to each edge so the silhouette
// looks hand-torn but stable across renders.
const TOP_JITTER = [4, -3, 6, -2, 5, -4, 3, -5, 4, -3, 5, -2]
const BOTTOM_JITTER = [-3, 5, -4, 3, -5, 4, -3, 6, -2, 5, -3, 4]
const LEFT_JITTER = [3, -4, 5, -3, 4, -5, 3, -4, 5, -3]
const RIGHT_JITTER = [-4, 3, -5, 4, -3, 5, -4, 3, -5, 4]

function buildTornPath(width: number, height: number, inset = 8) {
  const x0 = inset
  const y0 = inset
  const x1 = width - inset
  const y1 = height - inset

  const w = x1 - x0
  const h = y1 - y0

  const topSteps = TOP_JITTER.length
  const bottomSteps = BOTTOM_JITTER.length
  const leftSteps = LEFT_JITTER.length
  const rightSteps = RIGHT_JITTER.length

  const parts: string[] = []
  parts.push(`M ${x0} ${y0 + LEFT_JITTER[0]}`)

  // Top edge — small bumps along y.
  for (let i = 1; i <= topSteps; i++) {
    const t = i / topSteps
    const x = x0 + w * t
    const dy = TOP_JITTER[i - 1]
    parts.push(`L ${x.toFixed(2)} ${(y0 + dy).toFixed(2)}`)
  }

  // Right edge — small bumps along x.
  for (let i = 1; i <= rightSteps; i++) {
    const t = i / rightSteps
    const y = y0 + h * t
    const dx = RIGHT_JITTER[i - 1]
    parts.push(`L ${(x1 + dx).toFixed(2)} ${y.toFixed(2)}`)
  }

  // Bottom edge — reverse direction.
  for (let i = 1; i <= bottomSteps; i++) {
    const t = i / bottomSteps
    const x = x1 - w * t
    const dy = BOTTOM_JITTER[i - 1]
    parts.push(`L ${x.toFixed(2)} ${(y1 + dy).toFixed(2)}`)
  }

  // Left edge — back up to the start.
  for (let i = 1; i <= leftSteps; i++) {
    const t = i / leftSteps
    const y = y1 - h * t
    const dx = LEFT_JITTER[i - 1]
    parts.push(`L ${(x0 + dx).toFixed(2)} ${y.toFixed(2)}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

export function TornPaperFrame({
  imageSrc,
  imageAlt,
  width = 320,
  height = 400,
  className,
}: Props) {
  const rawId = useId()
  const clipId = `torn-clip-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`
  const path = buildTornPath(width, height)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={imageAlt}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      {/* Soft paper backing peeking out behind the torn silhouette */}
      <path d={path} fill="#FAF3E3" opacity={0.7} transform="translate(3 4)" />

      {/* Photo clipped to the torn rectangle */}
      <image
        href={imageSrc}
        x={0}
        y={0}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* Thin sage outline */}
      <path
        d={path}
        fill="none"
        stroke="#ADB897"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  )
}
