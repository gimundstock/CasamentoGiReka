import { useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Props {
  count?: number
  className?: string
}

interface Petal {
  left: number
  size: number
  duration: number
  delay: number
  color: string
  rx: number
  ry: number
  rotate: number
}

const PALETTE = ['#8C7480', '#A39584', '#AA9DA9', '#C3CBB2', '#9A7F84']

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generatePetals(count: number): Petal[] {
  return Array.from({ length: count }, () => {
    const size = rand(8, 14)
    return {
      left: rand(5, 95),
      size,
      duration: rand(14, 24),
      delay: -rand(0, 10),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rx: size / 2,
      ry: size / 3.2,
      rotate: rand(0, 180),
    }
  })
}

export function PetalDrift({ count = 6, className }: Props) {
  const reduced = useReducedMotion()
  const [petals] = useState<Petal[]>(() => generatePetals(count))

  if (reduced) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className ?? ''}`}
    >
      {petals.map((p, i) => (
        <svg
          key={i}
          width={p.size}
          height={p.size}
          viewBox={`0 0 ${p.size} ${p.size}`}
          className="absolute top-0 animate-drift-down"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <ellipse
            cx={p.size / 2}
            cy={p.size / 2}
            rx={p.rx}
            ry={p.ry}
            fill={p.color}
            opacity="0.7"
            transform={`rotate(${p.rotate} ${p.size / 2} ${p.size / 2})`}
          />
        </svg>
      ))}
    </div>
  )
}
