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
const EASE_SOFT = [0.65, 0, 0.35, 1] as const
const NAV_HEIGHT = 68

/*
 * Scroll timeline (progress through the pinned track):
 *   0.00–0.06  the seal lifts away
 *   0.06–0.30  the flap swings open
 *   0.30–0.52  the invitation slides up out of the pocket
 *   0.52–0.75  the envelope falls away while the invitation grows to full size
 *   0.75–1.00  hold: the invitation sits still, ready to be turned over
 */
const T = {
  sealGone: 0.06,
  flapOpen: 0.3,
  flapVertical: 0.18,
  cardOut: 0.52,
  settled: 0.75,
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
  const cw = wide ? Math.min(880, w * 0.9, (h - NAV_HEIGHT - 64) / 0.625) : w - 32
  const ch = wide ? cw * 0.625 : h - NAV_HEIGHT - 40
  const s0 = Math.min((ew * 0.86) / cw, (eh * 0.86) / ch)
  const envY = h * 0.18
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

  const [flipped, setFlipped] = useState(false)
  const [ready, setReady] = useState(reduced)
  useMotionValueEvent(p, 'change', (v) => setReady(v >= T.settled - 0.02))

  const envY = useGeometryTransform(p, geoRef, [T.cardOut, T.settled], (g) => [g.envY, g.envGoneY])
  const envOpacity = useScrollRange(p, [T.cardOut + 0.05, T.settled], [1, 0])
  const flapRotate = useScrollRange(p, [T.sealGone, T.flapOpen], [0, 180])
  const flapZ = useTransform(p, (v) => (v > T.flapVertical ? 2 : 5))
  const sealOpacity = useScrollRange(p, [0, T.sealGone], [1, 0])
  const sealScale = useScrollRange(p, [0, T.sealGone], [1, 1.3])
  const hintOpacity = useScrollRange(p, [0, 0.05], [1, 0])
  const kickerOpacity = useScrollRange(p, [T.cardOut, T.cardOut + 0.1], [1, 0])

  const cardY = useGeometryTransform(p, geoRef, [T.flapOpen, T.cardOut, T.settled], (g) => [
    g.cardInY,
    g.cardOutY,
    g.cardFinalY,
  ])
  const cardScale = useGeometryTransform(p, geoRef, [T.cardOut, T.settled], (g) => [g.s0, 1])
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
      style={{ height: reduced ? '100svh' : '320vh' }}
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
          className="absolute rounded-[3px] shadow-[0_24px_40px_-12px_rgba(61,50,41,0.3)]"
          style={{
            ...envBox,
            zIndex: 1,
            background: 'linear-gradient(180deg, #DDB394 0%, #E7C1A3 100%)',
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
            background: 'linear-gradient(0deg, #F4D6BD 0%, #F0CDB1 100%)',
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
              background: 'linear-gradient(180deg, #F2D3BA 0%, #EBC5A8 100%)',
            }}
          />
        </motion.div>
        <motion.div aria-hidden className="absolute" style={{ ...envBox, zIndex: 6 }}>
          <motion.div
            className="absolute left-1/2 top-[60%] -ml-8 -mt-8 sm:-ml-10 sm:-mt-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
            style={{
              opacity: sealOpacity,
              scale: sealScale,
              background:
                'radial-gradient(circle at 35% 30%, #D58A6C 0%, #B96F52 45%, #8E4F39 100%)',
              boxShadow:
                'inset 0 0 0 4px rgba(142,79,57,0.55), inset 0 2px 6px rgba(255,220,200,0.35), 0 6px 14px rgba(61,50,41,0.3)',
            }}
          >
            <span className="font-display text-xl sm:text-2xl text-[#F6DCC6] drop-shadow-[0_1px_0_rgba(80,40,30,0.5)] pt-1">
              {CONFIG.couple.bride[0]}
              {CONFIG.couple.groom[0]}
            </span>
          </motion.div>
          <img
            src={`${base}flowers/lavender.png`}
            alt=""
            className="pointer-events-none absolute -left-6 sm:-left-14 -top-10 w-20 sm:w-28 -rotate-[24deg] opacity-90"
          />
          <img
            src={`${base}flowers/camomile_x1.png`}
            alt=""
            className="pointer-events-none absolute -right-4 sm:-right-10 -bottom-8 w-20 sm:w-28 rotate-12"
          />
          <motion.p
            className="absolute inset-x-0 -bottom-16 text-center font-serif italic text-title/70 text-lg"
            style={{ opacity: hintOpacity }}
          >
            <span className="animate-breath inline-block">{t('rsvp.envelopeHint')} ↓</span>
          </motion.p>
        </motion.div>

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
            style={{ transformStyle: 'preserve-3d', transformPerspective: 2400 }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: EASE_SOFT }}
          >
            <CardFace hidden={flipped || !ready}>
              <InvitationFront
                guest={guest}
                lang={lang}
                wide={geo.wide}
                onReply={() => setFlipped(true)}
              />
            </CardFace>
            <CardFace hidden={!flipped || !ready} back>
              <ReplyForm
                guest={guest}
                lang={lang}
                wide={geo.wide}
                onBack={() => setFlipped(false)}
              />
            </CardFace>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const POCKET = 'linear-gradient(160deg, #F6DCC6 0%, #EFCBAE 60%, #E8BF9F 100%)'
// Two side flaps meeting the bottom flap, as one outline.
const POCKET_CLIP = 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)'

// ── Card ──────────────────────────────────────────────────

function CardFace({
  children,
  hidden,
  back,
}: {
  children: ReactNode
  hidden: boolean
  back?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Keep the face that's turned away (or still in the envelope) out of the tab order.
  useEffect(() => {
    if (ref.current) ref.current.inert = hidden
  }, [hidden])

  return (
    <div
      ref={ref}
      aria-hidden={hidden}
      className="relative bg-peach-light bg-paper rounded-[3px] shadow-[0_30px_60px_-30px_rgba(61,50,41,0.4)] min-h-0 overflow-hidden"
      style={{
        gridArea: '1 / 1',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {/* Classic double rule. */}
      <div className="pointer-events-none absolute inset-3 border border-amber/40" />
      <div className="pointer-events-none absolute inset-[18px] border border-amber/20" />
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

function InvitationFront({
  guest,
  lang,
  wide,
  onReply,
}: {
  guest: Guest
  lang: Lang
  wide: boolean
  onReply: () => void
}) {
  const { t } = useTranslation()
  const date = formatDate(CONFIG.wedding.date, lang, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const deadline = formatDate(CONFIG.wedding.rsvpDeadline, lang, { day: 'numeric', month: 'long' })

  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center text-title">
      <p className="font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title/70">
        {t('rsvp.inviteTogether')}
      </p>
      <h2
        className={`font-display leading-[1.45] mt-3 ${
          wide ? 'text-[3.25rem] whitespace-nowrap' : 'text-5xl flex flex-col'
        }`}
      >
        {CONFIG.couple.bride}
        <span className={`text-amber ${wide ? 'text-4xl mx-4' : 'text-3xl leading-none -my-1'}`}>
          &amp;
        </span>
        {CONFIG.couple.groom}
      </h2>
      <p className="font-serif italic text-lg mt-5">{t('rsvp.inviteRequest')}</p>
      <p className="font-display text-3xl md:text-4xl leading-normal mt-5 mb-3 text-forest-deep">
        {guest.groupName}
      </p>
      <p className="font-serif italic text-lg">{t('rsvp.inviteCelebrate')}</p>

      <div className="my-5">
        <Sprig />
      </div>

      <div
        className={`flex items-center ${
          wide ? 'flex-row divide-x divide-amber/30' : 'flex-col gap-3'
        }`}
      >
        <p className={`font-sans text-xs tracking-[0.3em] uppercase ${wide ? 'px-6' : ''}`}>
          {date}
        </p>
        <p className={`font-serif text-lg ${wide ? 'px-6' : ''}`}>
          {t('rsvp.inviteTime', { time: CONFIG.wedding.time })}
        </p>
        <p className={`font-serif text-lg ${wide ? 'px-6' : ''}`}>
          {CONFIG.wedding.venue}
          <span className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-title/60 ml-2">
            Brasília
          </span>
        </p>
      </div>

      <p className="font-serif italic text-title/70 mt-6">
        {t('rsvp.replyBy', { date: deadline })}
      </p>
      <button
        type="button"
        onClick={onReply}
        className={`group mt-3 inline-flex items-center gap-3 ${CTA}`}
      >
        {t('rsvp.reply')}
        <span
          aria-hidden
          className="inline-block transition-transform duration-700 group-hover:rotate-180"
        >
          ↻
        </span>
      </button>
    </div>
  )
}

// ── Reply form (back of the card) ─────────────────────────

const FIELD =
  'w-full bg-transparent border-b border-forest-deep/20 py-2 font-serif text-base text-title placeholder:text-title/40 focus:outline-none focus:border-forest-deep/60 transition-colors'
const LABEL = 'font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title/80 block mb-1'

function ReplyForm({
  guest,
  lang,
  wide,
  onBack,
}: {
  guest: Guest
  lang: Lang
  wide: boolean
  onBack: () => void
}) {
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

  const backLink = (
    <button
      type="button"
      onClick={onBack}
      className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-title/60 hover:text-title transition-colors border-b border-transparent hover:border-title/40 pb-0.5"
    >
      ↺ {t('rsvp.backToInvite')}
    </button>
  )

  if (submitted) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center text-center text-title">
        <p className="font-serif text-3xl tracking-[0.3em] pl-[0.3em]">{t('rsvp.replyTitle')}</p>
        <div className="my-6">
          <Sprig />
        </div>
        <h3 className="font-serif text-2xl md:text-3xl">
          {alreadySubmitted ? t('rsvp.alreadyTitle') : t('rsvp.successTitle')}
        </h3>
        <p className="font-serif italic text-lg mt-3 mb-8">
          {alreadySubmitted ? t('rsvp.alreadySubmitted') : t('rsvp.successText')}
        </p>
        {backLink}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`text-title min-h-full ${
        wide ? 'grid grid-cols-[1.2fr_1fr] gap-12' : 'flex flex-col gap-6'
      }`}
    >
      <div>
        <p className="font-serif text-3xl tracking-[0.3em]">{t('rsvp.replyTitle')}</p>
        <p className="font-serif italic text-base mt-1 mb-4 text-title/80">
          {t('rsvp.letterOpening')}
        </p>

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

              {attendee.attending && (
                <select
                  value={attendee.menu}
                  onChange={(e) => updateAttendee(i, 'menu', e.target.value)}
                  required
                  aria-label={`${t('rsvp.menu')} — ${attendee.name}`}
                  className={FIELD}
                >
                  <option value="">{t('rsvp.menuPlaceholder')}</option>
                  {CONFIG.menuOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {lang === 'pt' ? opt.pt : opt.en}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`flex flex-col gap-5 ${wide ? 'pt-14' : ''}`}>
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
          {backLink}
        </div>
      </div>
    </form>
  )
}
