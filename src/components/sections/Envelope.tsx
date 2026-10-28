import { useState, type CSSProperties } from 'react'
import { EMBOSS_SHADOW } from '../ui/emboss'
import { CONFIG } from '../../content.config'

const base = import.meta.env.BASE_URL

/** The nav's height as the invitation lays itself out (px). */
export const NAV_HEIGHT = 68

/*
 * The envelope is four painted layers (public/rsvp/), registered onto the
 * same rectangle: the back with its blue liner, the front pocket with its
 * wavy opening, and the flap outside and inside. Landscape on wide screens,
 * standing upright on phones to match the upright card.
 */
export const ENVELOPE = {
  h: { aspect: 1493 / 828, flap: 546 / 828 },
  v: { aspect: 963 / 1491, flap: 754 / 1491 },
}

/** Space kept under the envelope for the "scroll to open" hint. */
export const ENV_HINT_ROOM = 64

/**
 * The envelope's size on a `w` × `h` screen. Up to half the screen's height
 * on wide screens, and taller on phones where it stands upright; never wider
 * than most of the screen. The open flap stands above it, so envelope + flap
 * must fit between the nav and the scroll hint underneath.
 */
export function envelopeSize(w: number, h: number) {
  const wide = w >= 768
  const orient: 'h' | 'v' = wide ? 'h' : 'v'
  const env = ENVELOPE[orient]
  const room = h - NAV_HEIGHT - 8 - ENV_HINT_ROOM
  const eh = Math.min(
    wide
      ? Math.min(840 / env.aspect, (w * 0.8) / env.aspect, h * 0.5)
      : Math.min(h * 0.62, (w * 0.86) / env.aspect),
    room / (1 + env.flap)
  )
  return { wide, orient, room, ew: eh * env.aspect, eh }
}

/** Closed, the envelope sits in the middle of the screen below the nav (px below centre). */
export const ENV_CLOSED_Y = NAV_HEIGHT / 2

/**
 * Where the blind-embossed monogram sits on each flap, on a clear patch of
 * paper (fractions of the flap's width/height), and its size as a fraction of
 * the envelope's width.
 */
export const EMBOSS = {
  h: { x: 0.66, y: 0.36, size: 0.036 },
  v: { x: 0.5, y: 0.3, size: 0.06 },
}

/**
 * The couple's monogram pressed into the paper and foiled in the invitation's
 * amber (the colour of its "&"): letters lifted by light catching their lower edges
 * and shadow along the upper ones, set at a slight angle like a hand stamp.
 */
export function Emboss({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`font-display pointer-events-none whitespace-nowrap leading-none select-none ${className ?? ''}`}
      style={{
        color: '#D89A35',
        textShadow: EMBOSS_SHADOW,
        ...style,
      }}
    >
      {CONFIG.couple.bride[0]}
      <span className="ml-[0.3em]">&amp;</span>
      <span className="-ml-[0.15em]">{CONFIG.couple.groom[0]}</span>
    </span>
  )
}

/** The flap's outside, with the monogram pressed into it. */
export function FlapFront({ orient, ew }: { orient: 'h' | 'v'; ew: number }) {
  return (
    <>
      <img
        src={`${base}rsvp/envelope-flap-${orient}.webp`}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full max-w-none select-none"
      />
      <Emboss
        className="absolute -translate-x-1/2 -translate-y-1/2 -rotate-[12deg]"
        style={{
          left: `${EMBOSS[orient].x * 100}%`,
          top: `${EMBOSS[orient].y * 100}%`,
          fontSize: ew * EMBOSS[orient].size,
        }}
      />
    </>
  )
}

/** The envelope's back layer's look: a soft shadow under the paper. */
export const ENVELOPE_BACK_CLASS =
  'absolute max-w-none select-none rounded-[3px] shadow-[0_24px_40px_-12px_rgba(70,80,95,0.28)]'

/**
 * The closed envelope, whole, filling its (ew-wide) box: the same layers
 * the invitation opens, stacked as it stacks them while shut.
 */
export function ShutEnvelope({ orient, ew }: { orient: 'h' | 'v'; ew: number }) {
  return (
    <>
      <img
        src={`${base}rsvp/envelope-back-${orient}.webp`}
        alt=""
        draggable={false}
        className={`${ENVELOPE_BACK_CLASS} inset-0 h-full w-full`}
      />
      <img
        src={`${base}rsvp/envelope-pocket-${orient}.webp`}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full max-w-none select-none"
      />
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: `${ENVELOPE[orient].flap * 100}%` }}
      >
        <FlapFront orient={orient} ew={ew} />
      </div>
    </>
  )
}

/**
 * A looping CSS animation's delay so that it runs in step with the page's
 * clock: two copies of it (the desk's envelope and the invitation's) then
 * breathe together, and handing over from one to the other shows no jump.
 */
export function useClockDelay(periodMs: number) {
  const [delay] = useState(() => `${-(performance.now() % periodMs).toFixed(0)}ms`)
  return delay
}

/** tailwind.config's `breath` animation's period. */
export const BREATH_MS = 4000
