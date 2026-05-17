import { useId } from 'react'

interface Props {
  imageSrc: string
  imageAlt: string
  width?: number
  height?: number
  tint?: string
  borderColor?: string
  className?: string
}

export function OvalFrame({
  imageSrc,
  imageAlt,
  width = 320,
  height = 400,
  tint = '#ADB897',
  borderColor = '#4E784F',
  className,
}: Props) {
  const rawId = useId()
  const clipId = `oval-clip-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`

  const cx = width / 2
  const cy = height / 2
  const rx = width * 0.42
  const ry = height * 0.46

  // Slightly offset watercolor backing so it peeks out like a stain.
  const backingCx = cx - 14
  const backingCy = cy + 10

  // Hand-drawn-feeling outline as a path so we can later make it imperfect
  // without changing the API; for now it traces the oval.
  const outlinePath = `M ${cx} ${cy - ry} C ${cx + rx * 0.9} ${cy - ry} ${cx + rx} ${cy - ry * 0.4} ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * 0.7} ${cx + rx * 0.7} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * 0.8} ${cy + ry} ${cx - rx} ${cy + ry * 0.5} ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 0.6} ${cx - rx * 0.85} ${cy - ry} ${cx} ${cy - ry} Z`

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
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>

      {/* Watercolor backing — offset and slightly larger than the photo oval */}
      <ellipse cx={backingCx} cy={backingCy} rx={rx + 10} ry={ry + 8} fill={tint} opacity={0.22} />
      <ellipse
        cx={backingCx + 4}
        cy={backingCy - 4}
        rx={rx + 4}
        ry={ry + 2}
        fill={tint}
        opacity={0.18}
      />

      {/* Photo clipped to the oval */}
      <image
        href={imageSrc}
        x={cx - rx}
        y={cy - ry}
        width={rx * 2}
        height={ry * 2}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* Hand-drawn-feeling outline */}
      <path
        d={outlinePath}
        fill="none"
        stroke={borderColor}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  )
}
