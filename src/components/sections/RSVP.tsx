import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  interpolate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'
import { useReducedMotion } from '../motion/useReducedMotion'

const RSVP_STORAGE_KEY = 'wedding_rsvp_submitted'
const base = import.meta.env.BASE_URL
const NAV_HEIGHT = 68

/*
 * Scroll timeline (progress through the pinned track):
 *   0.00–0.04  the seal lifts away
 *   0.04–0.20  the flap swings open
 *   0.20–0.35  the invitation slides up out of the pocket
 *   0.35–0.50  the envelope falls away while the invitation grows to full size
 *   0.50–0.62  hold: the invitation, front side
 *   0.62–0.78  the card turns over
 *   0.78–1.00  hold: the reply form
 */
const T = {
  sealGone: 0.04,
  flapOpen: 0.2,
  flapVertical: 0.12,
  cardOut: 0.35,
  settled: 0.5,
  flipStart: 0.62,
  flipEnd: 0.78,
}

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
  envY: number
  /** Where the envelope ends up once it has fallen away. */
  envGoneY: number
  cardInY: number
  cardOutY: number
  cardFinalY: number
}

function measure(w: number, h: number): Geometry {
  const wide = w >= 768
  const ew = Math.min(560, w * 0.88, h * 0.54)
  const eh = ew / 1.5
  // Landscape card on wide screens; on phones a landscape card would be
  // unreadably small, so it stands upright instead.
  const cw = wide ? Math.min(960, w * 0.92, (h - NAV_HEIGHT - 56) / 0.625) : w - 32
  const ch = wide ? cw * 0.625 : h - NAV_HEIGHT - 80
  const s0 = Math.min((ew * 0.86) / cw, (eh * 0.86) / ch)
  const envY = h * 0.1
  return {
    wide,
    ew,
    eh,
    cw,
    ch,
    s0,
    envY,
    envGoneY: envY + h * 0.75,
    cardInY: envY + eh * 0.04,
    // Fully clear of the pocket, so it can step in front of it without a pop.
    cardOutY: envY - eh / 2 - (s0 * ch) / 2 - eh * 0.03,
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
  // Transforms read the latest geometry through a ref so a resize never
  // remounts the card (and never loses what the guest has typed).
  const geoRef = useRef(geo)
  useLayoutEffect(() => {
    geoRef.current = geo
  })

  const [face, setFace] = useState(() => faceAt(p.get()))
  useMotionValueEvent(p, 'change', (v) => setFace(faceAt(v)))

  const envY = useGeometryTransform(p, geoRef, [T.cardOut, T.settled], (g) => [g.envY, g.envGoneY])
  const envOpacity = useScrollRange(p, [T.cardOut + 0.05, T.settled], [1, 0])
  const flapRotate = useScrollRange(p, [T.sealGone, T.flapOpen], [0, 180])
  const flapZ = useTransform(p, (v) => (v > T.flapVertical ? 2 : 5))
  const sealOpacity = useScrollRange(p, [0, T.sealGone], [1, 0])
  const sealScale = useScrollRange(p, [0, T.sealGone], [1, 1.3])
  const hintOpacity = useScrollRange(p, [0, 0.05], [1, 0])
  const replyHintOpacity = useScrollRange(
    p,
    [T.settled - 0.03, T.settled, T.flipStart, T.flipStart + 0.03],
    [0, 1, 1, 0]
  )
  const kickerOpacity = useScrollRange(p, [T.cardOut, T.cardOut + 0.1], [1, 0])

  const cardY = useGeometryTransform(p, geoRef, [T.flapOpen, T.cardOut, T.settled], (g) => [
    g.cardInY,
    g.cardOutY,
    g.cardFinalY,
  ])
  const cardScale = useGeometryTransform(p, geoRef, [T.cardOut, T.settled], (g) => [g.s0, 1])
  const cardFlip = useScrollRange(p, [T.flipStart, T.flipEnd], [0, 180])
  const cardZ = useTransform(p, (v) => (v > T.cardOut - 0.01 ? 7 : 3))

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

        {/* Envelope, built as sibling layers so the card can slot between them. */}
        <motion.div
          aria-hidden
          className="absolute rounded-[3px] shadow-[0_24px_40px_-12px_rgba(70,80,95,0.28)]"
          style={{
            ...envBox,
            zIndex: 1,
            background: 'linear-gradient(180deg, #C5CFD8 0%, #D3DCE3 100%)',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute"
          style={{ ...envBox, zIndex: 4, background: POCKET, clipPath: POCKET_CLIP }}
        />
        <motion.div
          aria-hidden
          className="absolute"
          style={{
            ...envBox,
            zIndex: 4,
            background: 'linear-gradient(0deg, #F0F3F5 0%, #E6EBEF 100%)',
            clipPath: 'polygon(0 100%, 50% 44%, 100% 100%)',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute"
          style={{ ...envBox, y: envY, opacity: envOpacity, zIndex: flapZ }}
        >
          <motion.div
            className="absolute left-0 right-0 top-0 h-[60%]"
            style={{
              rotateX: flapRotate,
              originY: 0,
              transformPerspective: 1400,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              background: 'linear-gradient(180deg, #EBEFF2 0%, #DCE3E8 100%)',
            }}
          />
        </motion.div>
        <motion.div aria-hidden className="absolute" style={{ ...envBox, zIndex: 6 }}>
          {/* The seal: a single white flower pressed where the flaps meet. */}
          <motion.img
            src={`${base}flowers/camomile_x1.png`}
            alt=""
            className="absolute left-1/2 top-[60%] -ml-11 -mt-11 sm:-ml-14 sm:-mt-14 w-[5.5rem] h-[5.5rem] sm:w-28 sm:h-28 drop-shadow-[0_6px_10px_rgba(70,80,95,0.25)]"
            style={{ opacity: sealOpacity, scale: sealScale }}
          />
          <img
            src={`${base}flowers/lavender.png`}
            alt=""
            className="pointer-events-none absolute -left-6 sm:-left-14 -top-10 w-20 sm:w-28 -rotate-[24deg] opacity-90"
          />
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
              rotateY: cardFlip,
            }}
          >
            <CardFace
              hidden={face !== 'front'}
              image={`${base}flowers/invitation-bg.webp`}
              rotate={geo.wide ? undefined : { w: geo.cw, h: geo.ch }}
            >
              <InvitationFront guest={guest} lang={lang} wide={geo.wide} />
            </CardFace>
            <CardFace hidden={face !== 'back'} back>
              <ReplyForm guest={guest} wide={geo.wide} />
            </CardFace>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Silvery paper, cooled toward the blue wash of the invitation's painting.
const POCKET = 'linear-gradient(160deg, #F2F4F6 0%, #E4E9ED 60%, #D6DEE4 100%)'
// Two side flaps meeting the bottom flap, as one outline.
const POCKET_CLIP = 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)'

// ── Card ──────────────────────────────────────────────────

function CardFace({
  children,
  hidden,
  back,
  image,
  rotate,
}: {
  children: ReactNode
  hidden: boolean
  back?: boolean
  /** Painted artwork for this face; replaces the paper and the ruled border. */
  image?: string
  /**
   * Card size when the landscape artwork has to fill an upright card: the
   * painting is turned 90° clockwise so its flowers run down the left side.
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
        image ? 'bg-[#FFFEFB]' : 'bg-[#F6F6F5] bg-paper'
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

function Sprig() {
  return (
    <svg viewBox="0 0 120 24" className="w-24 h-5 mx-auto text-sage" aria-hidden>
      <path d="M4 12 H116" stroke="currentColor" strokeWidth="0.8" />
      <g fill="currentColor">
        <ellipse cx="44" cy="8" rx="6" ry="2.4" transform="rotate(-25 44 8)" />
        <ellipse cx="44" cy="16" rx="6" ry="2.4" transform="rotate(25 44 16)" />
        <ellipse cx="76" cy="8" rx="6" ry="2.4" transform="rotate(25 76 8)" />
        <ellipse cx="76" cy="16" rx="6" ry="2.4" transform="rotate(-25 76 16)" />
      </g>
      <circle cx="60" cy="12" r="3" className="text-amber" fill="currentColor" />
    </svg>
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
  const storageKey = `${RSVP_STORAGE_KEY}_${guest.guestId}`
  const [alreadySubmitted] = useState(() => localStorage.getItem(storageKey) === 'true')

  const [attendees, setAttendees] = useState<RSVPAttendee[]>(
    guest.attendees.map((name) => ({ name, attending: true, menu: '' }))
  )
  const [songRequest, setSongRequest] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
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
      localStorage.setItem(storageKey, 'true')
      setSubmitted(true)
    } catch {
      setError(t('rsvp.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center text-title">
        <p className="font-display text-2xl md:text-3xl leading-[1.7] pt-2">
          {t('rsvp.replyTitle')}
        </p>
        <div className="my-6">
          <Sprig />
        </div>
        <h3 className="font-serif text-2xl md:text-3xl">
          {alreadySubmitted ? t('rsvp.alreadyTitle') : t('rsvp.successTitle')}
        </h3>
        <p className="font-serif italic text-lg mt-3">
          {alreadySubmitted ? t('rsvp.alreadySubmitted') : t('rsvp.successText')}
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
