interface Props {
  color?: string
  size?: number
  rotation?: number
  className?: string
}

// Curved teardrop petal. Centered around (10, 10) on a 20x20 unit canvas
// so it stays inside the viewBox at any rotation up to ~45deg.
const PETAL_D = 'M 10 2 C 14 5 16 10 13 16 C 11 18 9 18 7 16 C 4 10 6 5 10 2 Z'

export function Petal({ color = '#F7D8BD', size = 12, rotation = 0, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path d={PETAL_D} fill={color} transform={`rotate(${rotation} 10 10)`} />
    </svg>
  )
}
