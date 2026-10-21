import type { CSSProperties } from 'react'
import { motion, useTransform, type MotionStyle, type MotionValue } from 'framer-motion'
import { SUN_SRC } from './sun'

const FILTER_ID = 'sun-watercolor'

/**
 * The watercolor treatment for the sun photo: detail washed out, color
 * softened, a wobbly edge, paper grain and pigment mottling. Render once
 * on the page; SunImage refers to it by id.
 */
export function SunWatercolorFilter() {
  return (
    <svg aria-hidden className="absolute h-0 w-0">
      <filter
        id={FILTER_ID}
        x="-25%"
        y="-25%"
        width="150%"
        height="150%"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="soft" />
        <feColorMatrix in="soft" type="saturate" values="1.05" result="wash" />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="3"
          seed="4"
          result="warp"
        />
        <feDisplacementMap
          in="wash"
          in2="warp"
          scale="10"
          xChannelSelector="R"
          yChannelSelector="G"
          result="shape"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="2"
          seed="9"
          result="grain"
        />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.6 0 0 0 1.25"
          result="grainAlpha"
        />
        {/* Mottling — the pigment settles unevenly, like the painted sky. */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.07"
          numOctaves="2"
          seed="2"
          result="mottle"
        />
        <feColorMatrix
          in="mottle"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.7 0 0 0 1.32"
          result="mottleAlpha"
        />
        <feComposite in="shape" in2="grainAlpha" operator="in" result="grained" />
        <feComposite in="grained" in2="mottleAlpha" operator="in" />
      </filter>
    </svg>
  )
}

interface Props {
  /** 0 = the photo, 1 = fully watercolor. */
  paint: MotionValue<number>
  className?: string
  style?: MotionStyle
}

const fill: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

/**
 * The sun: the flower-center photo, crossfading into its watercolor
 * version as `paint` goes 0 → 1. The watercolor fades in over the photo,
 * and the photo only leaves at the end, so it never dips transparent.
 */
export function SunImage({ paint, className, style }: Props) {
  const photoOpacity = useTransform(paint, (p: number) => Math.min(1, Math.max(0, (1 - p) / 0.4)))
  return (
    <motion.div className={className} style={style}>
      <motion.img
        src={SUN_SRC}
        alt=""
        draggable={false}
        className="max-w-none select-none"
        style={{ ...fill, opacity: photoOpacity }}
      />
      <motion.img
        src={SUN_SRC}
        alt=""
        draggable={false}
        className="max-w-none select-none"
        style={{ ...fill, opacity: paint, filter: `url(#${FILTER_ID})` }}
      />
    </motion.div>
  )
}
