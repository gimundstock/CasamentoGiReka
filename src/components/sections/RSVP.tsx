import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  interpolate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'
import { useReducedMotion } from '../motion/useReducedMotion'

const base = import.meta.env.BASE_URL
const NAV_HEIGHT = 68

/*
 * Scroll timeline (progress through the pinned track):
 *   0.00–0.06  the closed envelope, centred, moves down to make room for the flap
 *   0.06–0.20  the flap swings open
 *   0.20–0.35  the invitation slides up out of the pocket
 *   0.35–0.50  the envelope falls away while the invitation grows to full size
 *   0.50–0.62  hold: the invitation, front side
 *   0.62–0.78  the card turns over
 *   0.78–1.00  hold: the reply form
 */
const T = {
  envDown: 0.06,
  flapStart: 0.06,
  flapOpen: 0.2,
  flapVertical: 0.12,
  cardOut: 0.35,
  settled: 0.5,
  flipStart: 0.62,
  flipEnd: 0.78,
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Sine ease-in-out: gentle at both ends without rushing the middle. */
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Which face can be interacted with at a given progress. */
function faceAt(v: number): 'none' | 'front' | 'back' {
  if (v >= T.flipEnd - 0.01) return 'back'
  if (v >= T.settled - 0.01 && v <= T.flipStart + 0.01) return 'front'
  return 'none'
}

type Lang = 'pt' | 'en'

interface Props {
  guest: Guest
}

/** ISO dates parse as UTC midnight, which is still the previous day in Brasília. */
function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-GB', opts)
}

// ── Geometry ──────────────────────────────────────────────

interface Geometry {
  wide: boolean
  /** Envelope width / height. */
  ew: number
  eh: number
  /** Full-size card width / height. */
  cw: number
  ch: number
  /** Card scale while it sits in the envelope. */
  s0: number
  /** Vertical offsets from the stage centre (px). */
  /** Closed and centred, before it moves down to open. */
  envClosedY: number
  cardInClosedY: number
  envY: number
  /** Where the envelope ends up once it has fallen away. */
  envGoneY: number
  cardInY: number
  cardOutY: number
  cardFinalY: number
}

/*
 * The envelope is four painted layers (public/rsvp/), registered onto the
 * same rectangle: the back with its blue liner, the front pocket with its
 * wavy opening, and the flap outside and inside. Landscape on wide screens,
 * standing upright on phones to match the upright card.
 */
const ENVELOPE = {
  h: { aspect: 1493 / 828, flap: 546 / 828 },
  v: { aspect: 963 / 1491, flap: 754 / 1491 },
}

/** Space kept under the envelope for the "scroll to open" hint. */
const ENV_HINT_ROOM = 64

/** How much of the envelope the card fills while it sits inside. */
const IN_ENVELOPE = 0.96

function measure(w: number, h: number): Geometry {
  const wide = w >= 768
  const env = ENVELOPE[wide ? 'h' : 'v']
  // Up to half the screen's height on wide screens, and taller on phones
  // where it stands upright; never wider than most of the screen. The open
  // flap stands above it, so envelope + flap must fit between the nav and
  // the scroll hint underneath.
  const room = h - NAV_HEIGHT - 8 - ENV_HINT_ROOM
  const eh = Math.min(
    wide
      ? Math.min(840 / env.aspect, (w * 0.8) / env.aspect, h * 0.5)
      : Math.min(h * 0.62, (w * 0.86) / env.aspect),
    room / (1 + env.flap)
  )
  const ew = eh * env.aspect
  // Landscape card on wide screens; on phones a landscape card would be
  // unreadably small, so it stands upright instead.
  const cw = wide ? Math.min(1100, w * 0.94, (h - NAV_HEIGHT - 56) / 0.625) : w - 20
  const ch = wide ? cw * 0.625 : h - NAV_HEIGHT - 80
  const s0 = Math.min((ew * IN_ENVELOPE) / cw, (eh * IN_ENVELOPE) / ch)
  // Centred in the room left once the open flap is accounted for.
  const envTop = NAV_HEIGHT + 8 + env.flap * eh + (room - (1 + env.flap) * eh) / 2
  const envY = envTop + eh / 2 - h / 2
  // Closed, it sits in the middle of the screen below the nav.
  const envClosedY = NAV_HEIGHT / 2
  // Card centre relative to the envelope's: its top edge 2% below the envelope's.
  const cardInOffset = -eh / 2 + eh * 0.02 + (s0 * ch) / 2
  return {
    wide,
    ew,
    eh,
    cw,
    ch,
    s0,
    envClosedY,
    cardInClosedY: envClosedY + cardInOffset,
    envY,
    envGoneY: envY + h * 0.75,
    // Tucked up under the envelope's top edge. When the card is shorter than
    // the envelope (the upright one on phones), whatever is left over falls
    // behind the pocket instead of showing as a band of blue liner above it.
    cardInY: envY + cardInOffset,
    // Out of the pocket as far as the screen allows: fully clear when there
    // is room, otherwise stopping just below the nav. It stays behind the
    // pocket either way; the envelope falling away uncovers the rest.
    cardOutY: Math.max(
      envY - eh / 2 - (s0 * ch) / 2 - eh * 0.03,
      -h / 2 + NAV_HEIGHT + 16 + (s0 * ch) / 2
    ),
    cardFinalY: NAV_HEIGHT / 2,
  }
}

/**
 * Viewport size. Height only updates when the width does too: phone browsers
 * shrink the height when the URL bar or keyboard shows, and the card must not
 * resize under a guest who is typing.
 */
function useStageSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () =>
      setSize((prev) =>
        prev.w === window.innerWidth ? prev : { w: window.innerWidth, h: window.innerHeight }
      )
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/**
 * Function-form transform of scroll progress. Framer hands array-form opacity
 * transforms of a `useScroll` value to the browser's native ScrollTimeline,
 * which ignores the target's offsets and tracks whole-page scroll instead;
 * a function transform stays on the JS path and follows this section.
 */
function useScrollRange(p: MotionValue<number>, input: number[], output: number[]) {
  return useTransform(p, (v) => interpolate(input, output)(v))
}

/** Maps scroll progress onto geometry-dependent keyframes, read fresh each frame. */
function useGeometryTransform(
  p: MotionValue<number>,
  geoRef: { current: Geometry },
  input: number[],
  pick: (g: Geometry) => number[]
) {
  return useTransform(p, (v) => interpolate(input, pick(geoRef.current))(v))
}

// ── Section ───────────────────────────────────────────────

export function RSVP({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const reduced = useReducedMotion()

  const trackRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const settled = useMotionValue(1)
  const p = reduced ? settled : scrollYProgress

  const { w, h } = useStageSize()
  const geo = measure(w, h)
  const orient = geo.wide ? 'h' : 'v'
  // Transforms read the latest geometry through a ref so a resize never
  // remounts the card (and never loses what the guest has typed).
  const geoRef = useRef(geo)
  useLayoutEffect(() => {
    geoRef.current = geo
  })

  const [face, setFace] = useState(() => faceAt(p.get()))
  useMotionValueEvent(p, 'change', (v) => setFace(faceAt(v)))

  const envY = useGeometryTransform(p, geoRef, [0, T.envDown, T.cardOut, T.settled], (g) => [
    g.envClosedY,
    g.envY,
    g.envY,
    g.envGoneY,
  ])
  const envOpacity = useScrollRange(p, [T.cardOut + 0.05, T.settled], [1, 0])
  const flapRotate = useScrollRange(p, [T.flapStart, T.flapOpen], [0, 180])
  const flapZ = useTransform(p, (v) => (v > T.flapVertical ? 2 : 5))
  const hintOpacity = useScrollRange(p, [0, 0.05], [1, 0])
  const replyHintOpacity = useScrollRange(
    p,
    [T.settled - 0.03, T.settled, T.flipStart, T.flipStart + 0.03],
    [0, 1, 1, 0]
  )
  // Gone as the flap opens: the open flap stands where the kicker sits.
  const kickerOpacity = useScrollRange(p, [T.flapStart, T.flapStart + 0.06], [1, 0])

  const cardY = useGeometryTransform(
    p,
    geoRef,
    [0, T.envDown, T.flapOpen, T.cardOut, T.settled],
    (g) => [g.cardInClosedY, g.cardInY, g.cardInY, g.cardOutY, g.cardFinalY]
  )
  const cardScale = useGeometryTransform(p, geoRef, [T.cardOut, T.settled], (g) => [g.s0, 1])
  // Turned over like a card in the hand rather than a sign on a pivot: the
  // turn eases in and out, and on the way the card lifts a little, grows,
  // leans back and swings a few degrees before settling flat again.
  // A spring follows the scroll so each wheel tick glides instead of jumping.
  const flipRaw = useTransform(p, (v) =>
    easeInOut(clamp01((v - T.flipStart) / (T.flipEnd - T.flipStart)))
  )
  const flipSpring = useSpring(flipRaw, { stiffness: 120, damping: 24, mass: 0.6 })
  const flipT = reduced ? flipRaw : flipSpring
  const cardFlip = useTransform(flipT, (t) => t * 180)
  const flipArc = useTransform(flipT, (t) => Math.sin(t * Math.PI))
  const flipLift = useTransform(flipArc, (a) => -a * 18)
  const flipScale = useTransform(flipArc, (a) => 1 + a * 0.04)
  const flipLean = useTransform(flipArc, (a) => a * 10)
  const flipSwing = useTransform(flipT, (t) => Math.sin(t * Math.PI) * -5 * (1 - t * 0.6))
  // The card stays behind the pocket until the envelope has fallen away, so
  // stepping in front never covers paper that was in front of it a frame ago.
  const cardZ = useTransform(p, (v) => (v > T.settled - 0.01 ? 7 : 3))

  const box = (width: number, height: number) => ({
    width,
    height,
    left: '50%',
    top: '50%',
    marginLeft: -width / 2,
    marginTop: -height / 2,
  })
  const envBox = { ...box(geo.ew, geo.eh), y: envY, opacity: envOpacity }

  return (
    <section
      id="rsvp"
      ref={trackRef}
      className="relative bg-peach bg-paper"
      style={{ height: reduced ? '100svh' : '480vh' }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.p
          className="absolute inset-x-0 text-center font-sans text-[0.65rem] tracking-[0.4em] uppercase text-amber"
          style={{ top: NAV_HEIGHT + 32, opacity: kickerOpacity }}
        >
          {t('rsvp.kicker')}
        </motion.p>

        {/* Envelope, built as sibling layers so the card can slot between
            them: back (1) · card while inside (3) · pocket (4) · flap (5,
            dropping to 2 once it stands past vertical, behind the card). */}
        <motion.img
          aria-hidden
          src={`${base}rsvp/envelope-back-${orient}.webp`}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none rounded-[3px] shadow-[0_24px_40px_-12px_rgba(70,80,95,0.28)]"
          style={{ ...envBox, zIndex: 1 }}
        />
        <motion.img
          aria-hidden
          src={`${base}rsvp/envelope-pocket-${orient}.webp`}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{ ...envBox, zIndex: 4 }}
        />
        <motion.div
          aria-hidden
          className="absolute"
          style={{ ...envBox, zIndex: flapZ, perspective: 1400 }}
        >
          {/* The flap turns over its top edge. Its inside is a second face,
              turned away to start with; the image is stored upside down so
              it reads right once the flap stands open above the envelope. */}
          <motion.div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${ENVELOPE[orient].flap * 100}%`,
              rotateX: flapRotate,
              originY: 0,
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">
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
                  fontSize: geo.ew * EMBOSS[orient].size,
                }}
              />
            </div>
            <img
              src={`${base}rsvp/envelope-flap-inside-${orient}.webp`}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full max-w-none select-none [backface-visibility:hidden] [transform:rotateX(180deg)]"
            />
          </motion.div>
        </motion.div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ ...envBox, zIndex: 6 }}
        >
          <motion.p
            className="absolute inset-x-0 -bottom-16 text-center font-serif italic text-title/70 text-lg"
            style={{ opacity: hintOpacity }}
          >
            <span className="animate-breath inline-block">{t('rsvp.envelopeHint')} ↓</span>
          </motion.p>
        </motion.div>

        <motion.p
          aria-hidden
          className="absolute inset-x-0 text-center font-sans text-[0.6rem] tracking-[0.35em] uppercase text-cta"
          style={{
            top: `calc(50% + ${geo.cardFinalY + geo.ch / 2 + 16}px)`,
            opacity: replyHintOpacity,
          }}
        >
          <span className="animate-breath inline-block">{t('rsvp.scrollToReply')} ↓</span>
        </motion.p>

        {/* The invitation. */}
        <motion.div
          className="absolute"
          style={{
            ...box(geo.cw, geo.ch),
            y: cardY,
            scale: cardScale,
            zIndex: cardZ,
          }}
        >
          <motion.div
            className="grid h-full"
            style={{
              transformStyle: 'preserve-3d',
              transformPerspective: 2400,
              y: flipLift,
              scale: flipScale,
              rotateX: flipLean,
              rotateY: cardFlip,
              rotateZ: flipSwing,
            }}
          >
            <CardFace
              hidden={face !== 'front'}
              image={`${base}flowers/invitation-bg.webp`}
              rotate={geo.wide ? undefined : { w: geo.cw, h: geo.ch }}
            >
              <InvitationFront guest={guest} lang={lang} wide={geo.wide} />
            </CardFace>
            <CardFace
              hidden={face !== 'back'}
              back
              paper={`${base}rsvp/card-back.webp`}
              rotate={geo.wide ? { w: geo.cw, h: geo.ch } : undefined}
            >
              <ReplyForm guest={guest} wide={geo.wide} />
            </CardFace>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/**
 * Where the blind-embossed monogram sits on each flap, on a clear patch of
 * paper (fractions of the flap's width/height), and its size as a fraction of
 * the envelope's width.
 */
const EMBOSS = {
  h: { x: 0.66, y: 0.36, size: 0.036 },
  v: { x: 0.5, y: 0.3, size: 0.06 },
}

/**
 * The couple's monogram pressed into the paper and foiled in the invitation's
 * amber (the colour of its "&"): letters lifted by light catching their lower edges
 * and shadow along the upper ones, set at a slight angle like a hand stamp.
 */
function Emboss({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`font-display pointer-events-none whitespace-nowrap leading-none select-none ${className ?? ''}`}
      style={{
        color: '#D89A35',
        textShadow:
          '0 1px 0 rgba(255, 250, 235, 0.9), 0 -1px 0 rgba(110, 80, 25, 0.35), 0 0 1px rgba(110, 80, 25, 0.2)',
        ...style,
      }}
    >
      {CONFIG.couple.bride[0]}
      <span className="ml-[0.3em]">&amp;</span>
      <span className="-ml-[0.15em]">{CONFIG.couple.groom[0]}</span>
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────

function CardFace({
  children,
  hidden,
  back,
  image,
  paper,
  rotate,
}: {
  children: ReactNode
  hidden: boolean
  back?: boolean
  /** Painted artwork for this face; replaces the paper and the ruled border. */
  image?: string
  /**
   * Full-bleed paper for this face, gold lines and all, in place of the plain
   * paper and ruled border. Upright artwork; `rotate` turns it for a
   * landscape card.
   */
  paper?: string
  /**
   * Card size when the artwork's orientation doesn't match the card's: it is
   * turned 90° clockwise to fill it (the front's landscape painting on an
   * upright card, the back's upright paper on a landscape one).
   */
  rotate?: { w: number; h: number }
}) {
  const paint = rotate
    ? {
        width: rotate.h,
        height: rotate.w,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
      }
    : { inset: 0 }

  const ref = useRef<HTMLDivElement>(null)

  // Keep the face that's turned away (or still in the envelope) out of the tab order.
  useEffect(() => {
    if (ref.current) ref.current.inert = hidden
  }, [hidden])

  return (
    <div
      ref={ref}
      aria-hidden={hidden}
      className={`relative rounded-[3px] shadow-[0_30px_60px_-30px_rgba(61,50,41,0.4)] min-h-0 overflow-hidden ${
        image || paper ? 'bg-[#FFFEFB]' : 'bg-[#F6F6F5] bg-paper'
      }`}
      style={{
        gridArea: '1 / 1',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {image ? (
        // The painting runs to the card's edge. Outside the gold rule it fades
        // to 40%, so the margin reads as a soft border; inside, a full-strength
        // copy of the same image is clipped to the rule so the two line up.
        <>
          <div
            className="pointer-events-none absolute bg-cover bg-bottom opacity-40"
            style={{ ...paint, backgroundImage: `url(${image})` }}
          />
          <div
            className="pointer-events-none absolute bg-cover bg-bottom [clip-path:inset(12px)] md:[clip-path:inset(16px)]"
            style={{ ...paint, backgroundImage: `url(${image})` }}
          />
          <div className="pointer-events-none absolute inset-3 md:inset-4 border border-[#C9A464]" />
        </>
      ) : paper ? (
        <div
          className="pointer-events-none absolute bg-cover bg-center"
          style={{ ...paint, backgroundImage: `url(${paper})` }}
        />
      ) : (
        <>
          {/* The same gold rule as the front, on the painting's paper white. */}
          <div className="pointer-events-none absolute inset-3 md:inset-4 border border-[#C9A464]" />
        </>
      )}
      <div className="relative h-full overflow-y-auto overscroll-contain px-8 py-10 md:px-14 md:py-11">
        {children}
      </div>
    </div>
  )
}

const CTA =
  'bg-cta text-peach-light font-sans px-10 py-4 text-xs tracking-[0.35em] uppercase transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_rgba(105,180,223,0.7)]'

function InvitationFront({ guest, lang, wide }: { guest: Guest; lang: Lang; wide: boolean }) {
  const { t } = useTranslation()
  const date = formatDate(CONFIG.wedding.date, lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const deadline = formatDate(CONFIG.wedding.rsvpDeadline, lang, { day: 'numeric', month: 'long' })

  return (
    // Bottom padding (a % of the width) keeps the text in the clear centre, above the painted flowers.
    <div
      className={`relative min-h-full flex flex-col items-center justify-center text-center text-title ${
        wide ? 'pb-[7%]' : 'pb-20 pl-[22%]'
      }`}
    >
      {/* The details, tucked into a corner like a printed card's colophon: top right on
          wide cards, bottom right on upright ones where the painted flowers fill the left. */}
      <div className={`absolute right-0 text-right leading-snug ${wide ? 'top-0' : 'bottom-0'}`}>
        <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase">{date}</p>
        <p className="font-serif text-sm mt-1">
          {t('rsvp.inviteTime', { time: CONFIG.wedding.time })}
        </p>
        <p className="font-serif text-sm">{CONFIG.wedding.venue}</p>
      </div>

      <h2
        className={`font-display leading-[1.45] ${
          wide ? 'text-[2.6rem] whitespace-nowrap' : 'text-4xl flex flex-col'
        }`}
      >
        {CONFIG.couple.bride}
        <span className={`text-amber ${wide ? 'text-3xl mx-3' : 'text-2xl leading-none -my-1'}`}>
          &amp;
        </span>
        {CONFIG.couple.groom}
      </h2>
      <p className="font-serif italic text-base md:text-lg mt-8">{t('rsvp.inviteRequest')}</p>
      <p className="font-display text-2xl md:text-3xl leading-normal mt-4 mb-2 text-forest-deep">
        {guest.groupName}
      </p>
      <p className="font-serif italic text-base md:text-lg mt-3">{t('rsvp.inviteCelebrate')}</p>

      <p className="font-serif italic text-sm md:text-base text-title/70 mt-6">
        {t('rsvp.replyBy', { date: deadline })}
      </p>
    </div>
  )
}

// ── Reply form (back of the card) ─────────────────────────

const FIELD =
  'w-full bg-transparent border-b border-forest-deep/20 py-2 font-serif text-base text-title placeholder:text-title/40 focus:outline-none focus:border-forest-deep/60 transition-colors'
const LABEL = 'font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title/80 block mb-1'

function ReplyForm({ guest, wide }: { guest: Guest; wide: boolean }) {
  const { t } = useTranslation()
  // Whether they already replied comes from the backend (a row for this guest
  // in the RSVPs tab), so it holds on every device and browser.
  const alreadySubmitted = guest.rsvpSubmitted === true

  const [attendees, setAttendees] = useState<RSVPAttendee[]>(
    guest.attendees.map((name) => ({ name, attending: true, menu: '' }))
  )
  const [songRequest, setSongRequest] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateAttendee(index: number, field: keyof RSVPAttendee, value: string | boolean) {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await submitRSVP({ guestId: guest.guestId, attendees, songRequest, message })
      setJustSubmitted(true)
    } catch {
      setError(t('rsvp.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (justSubmitted || alreadySubmitted) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center text-title">
        <p className="font-display text-2xl md:text-3xl leading-[1.7] pt-2">
          {t('rsvp.replyTitle')}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl mt-6">
          {justSubmitted ? t('rsvp.successTitle') : t('rsvp.alreadyTitle')}
        </h3>
        <p className="font-serif italic text-lg mt-3">
          {justSubmitted ? t('rsvp.successText') : t('rsvp.alreadySubmitted')}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`text-title min-h-full ${
        wide ? 'grid grid-cols-[1.2fr_1fr] gap-x-12 gap-y-4 content-center' : 'flex flex-col gap-6'
      }`}
    >
      <div className={`text-center ${wide ? 'col-span-2 mb-2' : ''}`}>
        <p className="font-display text-2xl md:text-3xl leading-[1.7] pt-2">
          {t('rsvp.replyTitle')}
        </p>
        <p className="font-serif italic text-base mt-6 text-title/80">{t('rsvp.letterOpening')}</p>
      </div>

      <div>
        <div className="space-y-4">
          {attendees.map((attendee, i) => (
            <div key={i} className="border-t border-forest-deep/10 pt-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-serif text-xl">{attendee.name}</span>
                <div className="flex gap-3 text-[0.6rem] tracking-[0.3em] uppercase font-sans">
                  {([true, false] as const).map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => updateAttendee(i, 'attending', value)}
                      aria-pressed={attendee.attending === value}
                      className={`pb-1 border-b transition-colors ${
                        attendee.attending === value
                          ? 'text-title border-forest-deep'
                          : 'text-title/45 border-transparent hover:text-title'
                      }`}
                    >
                      {value ? t('rsvp.attending') : t('rsvp.notAttending')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-5 ${wide ? 'pt-3' : ''}`}>
        <div>
          <label htmlFor="rsvp-song" className={LABEL}>
            {t('rsvp.song')}
          </label>
          <input
            id="rsvp-song"
            type="text"
            value={songRequest}
            onChange={(e) => setSongRequest(e.target.value)}
            placeholder={t('rsvp.songPlaceholder')}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="rsvp-message" className={LABEL}>
            {t('rsvp.message')}
          </label>
          <textarea
            id="rsvp-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('rsvp.messagePlaceholder', {
              bride: CONFIG.couple.bride,
              groom: CONFIG.couple.groom,
            })}
            rows={3}
            className={`${FIELD} resize-none`}
          />
        </div>

        {error && <p className="font-serif text-terracotta text-center">{error}</p>}

        <div className="mt-auto pt-2 flex flex-col items-center gap-4">
          <button
            type="submit"
            disabled={submitting}
            className={`${CTA} w-full disabled:opacity-50 disabled:hover:translate-y-0`}
          >
            <span className={submitting ? 'animate-breath' : undefined}>
              {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
            </span>
          </button>
        </div>
      </div>
    </form>
  )
}
