import { useId } from 'react'

interface Props {
  className?: string
  variant?: 'top' | 'bottom' | 'left' | 'right' | 'scatter'
  opacity?: number
}

export function WildflowerDecor({ className = '', variant = 'scatter', opacity = 0.35 }: Props) {
  const style = { opacity }

  if (variant === 'top') {
    return (
      <div
        className={`absolute top-0 left-0 right-0 pointer-events-none overflow-hidden ${className}`}
        style={style}
      >
        <WildflowerRow flip={false} />
      </div>
    )
  }

  if (variant === 'bottom') {
    return (
      <div
        className={`absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden ${className}`}
        style={style}
      >
        <WildflowerRow flip={true} />
      </div>
    )
  }

  return (
    <div className={`pointer-events-none select-none ${className}`} style={style} aria-hidden>
      <ScatteredFlowers />
    </div>
  )
}

function WildflowerRow({ flip }: { flip: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      style={{ transform: flip ? 'scaleY(-1)' : undefined }}
      aria-hidden
    >
      {/* Stems */}
      <path d="M100,120 Q110,80 105,40" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M200,120 Q195,70 205,30" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M350,120 Q340,75 355,35" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M500,120 Q510,65 495,25" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M650,120 Q645,80 660,38" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M800,120 Q810,70 800,28" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M950,120 Q940,75 955,32" stroke="#4E784F" strokeWidth="2" fill="none" />
      <path d="M1100,120 Q1110,68 1098,22" stroke="#4E784F" strokeWidth="2" fill="none" />

      {/* Leaves */}
      <ellipse cx="112" cy="70" rx="10" ry="5" fill="#ADB897" transform="rotate(-30 112 70)" />
      <ellipse cx="198" cy="55" rx="10" ry="5" fill="#ADB897" transform="rotate(25 198 55)" />
      <ellipse cx="346" cy="62" rx="10" ry="5" fill="#ADB897" transform="rotate(-20 346 62)" />
      <ellipse cx="504" cy="50" rx="10" ry="5" fill="#ADB897" transform="rotate(15 504 50)" />
      <ellipse cx="658" cy="65" rx="10" ry="5" fill="#ADB897" transform="rotate(-35 658 65)" />
      <ellipse cx="808" cy="55" rx="10" ry="5" fill="#ADB897" transform="rotate(20 808 55)" />
      <ellipse cx="944" cy="60" rx="10" ry="5" fill="#ADB897" transform="rotate(-25 944 60)" />
      <ellipse cx="1102" cy="48" rx="10" ry="5" fill="#ADB897" transform="rotate(30 1102 48)" />

      {/* Flowers */}
      <Flower cx={105} cy={38} color="#DC8000" />
      <Flower cx={204} cy={28} color="#DFB100" />
      <Flower cx={354} cy={32} color="#AA9DA9" />
      <Flower cx={495} cy={22} color="#DC8000" />
      <Flower cx={659} cy={35} color="#DFB100" />
      <Flower cx={800} cy={25} color="#AA9DA9" />
      <Flower cx={954} cy={29} color="#DC8000" />
      <Flower cx={1098} cy={19} color="#DFB100" />

      {/* Small grasses */}
      <path d="M160,120 Q165,95 158,75" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M280,120 Q285,92 278,72" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M430,120 Q434,93 427,73" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M580,120 Q584,90 577,68" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M730,120 Q735,88 728,70" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M880,120 Q884,90 877,71" stroke="#ADB897" strokeWidth="1.5" fill="none" />
      <path d="M1030,120 Q1034,92 1027,72" stroke="#ADB897" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function Flower({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const petalOffsets = [
    [0, -10],
    [7, -7],
    [10, 0],
    [7, 7],
    [0, 10],
    [-7, 7],
    [-10, 0],
    [-7, -7],
  ]
  return (
    <g>
      {petalOffsets.map(([dx, dy], i) => (
        <ellipse
          key={i}
          cx={cx + dx}
          cy={cy + dy}
          rx={5}
          ry={3}
          fill={color}
          transform={`rotate(${i * 45} ${cx + dx} ${cy + dy})`}
          opacity={0.85}
        />
      ))}
      <circle cx={cx} cy={cy} r={4} fill="#F5D1B2" />
      <circle cx={cx} cy={cy} r={2} fill={color} opacity={0.6} />
    </g>
  )
}

// Wildflower arch — a wide, low elliptical arbor framing a landscape photo.
// The entire garland (flowers, leaves, trailing stems) lives OUTSIDE the arch
// silhouette so the photo reads cleanly. Evokes a wedding ceremony arch.
export function WildflowerArch({ imageSrc, imageAlt }: { imageSrc: string; imageAlt: string }) {
  const rawId = useId()
  const clipId = `arch-clip-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`
  const archPath = 'M 50 400 L 50 200 A 250 120 0 0 1 550 200 L 550 400 Z'
  const archStroke = 'M 50 400 L 50 200 A 250 120 0 0 1 550 200 L 550 400'

  return (
    <svg
      viewBox="0 0 600 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
      role="img"
      aria-label={imageAlt}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={archPath} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="300" cy="410" rx="260" ry="5" fill="#4E784F" opacity="0.14" />

      {/* Sage fallback fills the arch if the image is missing */}
      <path d={archPath} fill="#ADB897" opacity="0.22" />

      {/* Photo, clipped to the arch silhouette */}
      <image
        href={imageSrc}
        x="50"
        y="80"
        width="500"
        height="320"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
      />

      {/* Soft arch outline */}
      <path d={archStroke} stroke="#4E784F" strokeWidth="1.6" fill="none" opacity="0.3" />

      {/* Garland arc riding above the arch apex */}
      <path
        d="M 40 210 Q 300 -30 560 210"
        stroke="#4E784F"
        strokeWidth="1.3"
        fill="none"
        opacity="0.5"
      />

      {/* Leaves along the garland — all above the arch curve */}
      <ellipse cx="108" cy="108" rx="11" ry="5" fill="#ADB897" transform="rotate(-42 108 108)" />
      <ellipse cx="170" cy="78" rx="11" ry="5" fill="#ADB897" transform="rotate(-22 170 78)" />
      <ellipse cx="238" cy="52" rx="11" ry="5" fill="#ADB897" transform="rotate(-8 238 52)" />
      <ellipse cx="362" cy="52" rx="11" ry="5" fill="#ADB897" transform="rotate(8 362 52)" />
      <ellipse cx="430" cy="78" rx="11" ry="5" fill="#ADB897" transform="rotate(22 430 78)" />
      <ellipse cx="492" cy="108" rx="11" ry="5" fill="#ADB897" transform="rotate(42 492 108)" />

      {/* Flowers along the garland — all positioned above the arch curve */}
      <Flower cx={90} cy={118} color="#DFB100" />
      <Flower cx={135} cy={92} color="#AA9DA9" />
      <Flower cx={200} cy={70} color="#DC8000" />
      <Flower cx={265} cy={55} color="#DFB100" />
      <Flower cx={300} cy={42} color="#DC8000" />
      <Flower cx={335} cy={55} color="#AA9DA9" />
      <Flower cx={400} cy={70} color="#DC8000" />
      <Flower cx={465} cy={92} color="#DFB100" />
      <Flower cx={510} cy={118} color="#AA9DA9" />

      {/* Trailing stems from the left shoulder, flowing outward */}
      <g opacity="0.9">
        <path d="M 48 202 Q 18 260 26 330" stroke="#4E784F" strokeWidth="1.3" fill="none" />
        <path d="M 40 235 Q 10 300 22 380" stroke="#4E784F" strokeWidth="1.1" fill="none" />
        <ellipse cx="20" cy="280" rx="9" ry="4" fill="#ADB897" transform="rotate(-55 20 280)" />
        <ellipse cx="14" cy="340" rx="9" ry="4" fill="#ADB897" transform="rotate(-40 14 340)" />
      </g>

      {/* Trailing stems from the right shoulder, mirrored */}
      <g opacity="0.9">
        <path d="M 552 202 Q 582 260 574 330" stroke="#4E784F" strokeWidth="1.3" fill="none" />
        <path d="M 560 235 Q 590 300 578 380" stroke="#4E784F" strokeWidth="1.1" fill="none" />
        <ellipse cx="580" cy="280" rx="9" ry="4" fill="#ADB897" transform="rotate(55 580 280)" />
        <ellipse cx="586" cy="340" rx="9" ry="4" fill="#ADB897" transform="rotate(40 586 340)" />
      </g>

      {/* Trailing flowers beside the arch shoulders */}
      <Flower cx={32} cy={250} color="#DC8000" />
      <Flower cx={568} cy={250} color="#DFB100" />
      <Flower cx={22} cy={370} color="#AA9DA9" />
      <Flower cx={578} cy={370} color="#DC8000" />
    </svg>
  )
}

function ScatteredFlowers() {
  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      <Flower cx={50} cy={80} color="#DC8000" />
      <Flower cx={200} cy={30} color="#DFB100" />
      <Flower cx={360} cy={100} color="#AA9DA9" />
      <Flower cx={80} cy={250} color="#ADB897" />
      <Flower cx={320} cy={300} color="#DC8000" />
      <Flower cx={150} cy={370} color="#DFB100" />

      {/* stems */}
      <path d="M50,80 Q45,120 55,160" stroke="#4E784F" strokeWidth="1.5" fill="none" />
      <path d="M200,30 Q195,75 205,120" stroke="#4E784F" strokeWidth="1.5" fill="none" />
      <path d="M360,100 Q355,140 365,185" stroke="#4E784F" strokeWidth="1.5" fill="none" />

      {/* leaves */}
      <ellipse cx={47} cy={120} rx={9} ry={4} fill="#ADB897" transform="rotate(-20 47 120)" />
      <ellipse cx={203} cy={90} rx={9} ry={4} fill="#ADB897" transform="rotate(15 203 90)" />
      <ellipse cx={362} cy={150} rx={9} ry={4} fill="#ADB897" transform="rotate(-25 362 150)" />
    </svg>
  )
}
