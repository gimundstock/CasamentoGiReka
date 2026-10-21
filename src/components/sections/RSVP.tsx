import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'
import { MaskReveal } from '../motion/MaskReveal'
import { useReducedMotion } from '../motion/useReducedMotion'

const RSVP_STORAGE_KEY = 'wedding_rsvp_submitted'
const base = import.meta.env.BASE_URL
const EASE_SOFT = [0.65, 0, 0.35, 1] as const

// sealed → the flap swings open → the card slides out of the pocket → the
// envelope gives way to the full-size invitation.
type Stage = 'sealed' | 'opening' | 'rising' | 'open'
type Lang = 'pt' | 'en'

interface Props {
  guest: Guest
}

/** ISO dates parse as UTC midnight, which is still the previous day in Brasília. */
function formatDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-GB', opts)
}

export function RSVP({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Lang
  const reduced = useReducedMotion()

  const [stage, setStage] = useState<Stage>('sealed')
  const [flipped, setFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  function flip(toBack: boolean) {
    setFlipped(toBack)
    // A tall back face can leave the card's top above the fold; bring it back.
    const top = cardRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="rsvp" className="bg-peach bg-paper relative overflow-hidden py-28 md:py-40">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <MaskReveal direction="up" delay={0.05}>
          <p className="text-center font-sans text-[0.65rem] tracking-[0.4em] uppercase text-amber mb-14 md:mb-20">
            {t('rsvp.kicker')}
          </p>
        </MaskReveal>

        <AnimatePresence mode="wait" initial={false}>
          {stage !== 'open' ? (
            <motion.div
              key="envelope"
              // Headroom for the flap once it swings up above the envelope.
              className="pt-24 md:pt-36"
              exit={{ opacity: 0, y: 30, transition: { duration: reduced ? 0 : 0.5 } }}
            >
              <Envelope
                stage={stage}
                reduced={reduced}
                onOpen={() => setStage('opening')}
                onFlapOpen={() => setStage('rising')}
                onRisen={() => setStage('open')}
              />
              <p
                className={`text-center font-serif italic text-title/70 text-lg mt-12 transition-opacity duration-700 ${
                  stage === 'sealed' ? 'animate-breath' : 'opacity-0'
                }`}
              >
                {t('rsvp.envelopeHint')}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              ref={cardRef}
              className="mx-auto max-w-[540px] scroll-mt-24"
              style={{ perspective: 2200 }}
              initial={reduced ? false : { opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="grid"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: reduced ? 0 : 1.1, ease: EASE_SOFT }}
              >
                <CardFace hidden={flipped}>
                  <InvitationFront guest={guest} lang={lang} onReply={() => flip(true)} />
                </CardFace>
                <CardFace hidden={!flipped} back>
                  <ReplyForm guest={guest} lang={lang} onBack={() => flip(false)} />
                </CardFace>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// ── Envelope ──────────────────────────────────────────────

interface EnvelopeProps {
  stage: Stage
  reduced: boolean
  onOpen: () => void
  onFlapOpen: () => void
  onRisen: () => void
}

const SIDE_FLAP = 'linear-gradient(160deg, #F6DCC6 0%, #EFCBAE 60%, #E8BF9F 100%)'
const MONOGRAM = `${CONFIG.couple.bride[0]}${CONFIG.couple.groom[0]}`

function Envelope({ stage, reduced, onOpen, onFlapOpen, onRisen }: EnvelopeProps) {
  const { t } = useTranslation()
  const risen = stage === 'rising' || stage === 'open'
  const [y, m, d] = CONFIG.wedding.date.split('-')

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Wildflowers tucked around the envelope. */}
      <img
        src={`${base}flowers/lavender.png`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-6 sm:-left-14 -top-10 w-20 sm:w-28 -rotate-[24deg] opacity-90"
      />
      <img
        src={`${base}flowers/camomile_x1.png`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-4 sm:-right-10 -bottom-8 w-20 sm:w-28 rotate-12 z-10"
      />

      <div className="relative aspect-[3/2] w-full drop-shadow-[0_24px_30px_rgba(61,50,41,0.22)]">
        {/* Inside of the envelope. */}
        <div
          className="absolute inset-0 rounded-[3px]"
          style={{ background: 'linear-gradient(180deg, #DDB394 0%, #E7C1A3 100%)' }}
        />

        {/* The invitation, sliding out once the flap is open. */}
        <motion.div
          className="absolute left-[7%] right-[7%] top-[6%] h-[90%] bg-peach-light bg-paper rounded-[2px] shadow-sm flex flex-col items-center pt-[7%] text-center"
          style={{ zIndex: 2 }}
          initial={false}
          animate={{ y: risen ? '-58%' : '0%' }}
          transition={{ duration: reduced ? 0 : 1.2, ease: EASE_SOFT }}
          onAnimationComplete={() => {
            if (stage === 'rising') setTimeout(onRisen, reduced ? 0 : 250)
          }}
        >
          <div className="absolute inset-[6px] border border-amber/30 pointer-events-none" />
          <p className="font-sans text-[0.5rem] sm:text-[0.6rem] tracking-[0.4em] uppercase text-title/60">
            {d} · {m} · {y}
          </p>
          <p className="font-display text-2xl sm:text-4xl text-title mt-2 sm:mt-3">
            {CONFIG.couple.bride} &amp; {CONFIG.couple.groom}
          </p>
        </motion.div>

        {/* Pocket: two side flaps and the bottom flap. */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 3, clipPath: 'polygon(0 0, 52% 55%, 0 100%)', background: SIDE_FLAP }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 3,
            clipPath: 'polygon(100% 0, 48% 55%, 100% 100%)',
            background: SIDE_FLAP,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 3,
            clipPath: 'polygon(0 100%, 50% 44%, 100% 100%)',
            background: 'linear-gradient(0deg, #F4D6BD 0%, #F0CDB1 100%)',
          }}
        />

        {/* Top flap. Once it is past vertical it tucks behind the rising card. */}
        <motion.div
          className="absolute left-0 right-0 top-0 h-[60%]"
          style={{
            zIndex: risen ? 1 : 4,
            originY: 0,
            transformPerspective: 1400,
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            background: 'linear-gradient(180deg, #F2D3BA 0%, #EBC5A8 100%)',
          }}
          initial={false}
          animate={{ rotateX: stage === 'sealed' ? 0 : 180 }}
          transition={{ duration: reduced ? 0 : 0.95, ease: EASE_SOFT }}
          onAnimationComplete={() => {
            if (stage === 'opening') onFlapOpen()
          }}
        />

        {/* Wax seal. */}
        <AnimatePresence>
          {stage === 'sealed' && (
            <motion.button
              type="button"
              onClick={onOpen}
              aria-label={t('rsvp.openSeal')}
              className="absolute left-[calc(50%-2rem)] top-[calc(60%-2rem)] sm:left-[calc(50%-2.5rem)] sm:top-[calc(60%-2.5rem)] w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              style={{
                zIndex: 5,
                background:
                  'radial-gradient(circle at 35% 30%, #D58A6C 0%, #B96F52 45%, #8E4F39 100%)',
                boxShadow:
                  'inset 0 0 0 4px rgba(142,79,57,0.55), inset 0 2px 6px rgba(255,220,200,0.35), 0 6px 14px rgba(61,50,41,0.3)',
              }}
              whileHover={reduced ? undefined : { scale: 1.06 }}
              whileTap={reduced ? undefined : { scale: 0.95 }}
              exit={{ opacity: 0, scale: 1.25, transition: { duration: reduced ? 0 : 0.4 } }}
            >
              <span className="font-display text-xl sm:text-2xl text-[#F6DCC6] drop-shadow-[0_1px_0_rgba(80,40,30,0.5)] pt-1">
                {MONOGRAM}
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

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

  // Keep the face that's turned away out of the tab order.
  useEffect(() => {
    if (ref.current) ref.current.inert = hidden
  }, [hidden])

  return (
    <div
      ref={ref}
      aria-hidden={hidden}
      className="relative bg-peach-light bg-paper rounded-[3px] shadow-[0_30px_60px_-30px_rgba(61,50,41,0.4)] px-7 py-14 sm:px-14 sm:py-16 flex flex-col justify-center"
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
      {children}
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
  onReply,
}: {
  guest: Guest
  lang: Lang
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
    <div className="text-center text-title">
      <p className="font-sans text-[0.6rem] sm:text-[0.65rem] tracking-[0.4em] uppercase text-title/70">
        {t('rsvp.inviteTogether')}
      </p>
      <h2 className="font-display text-5xl sm:text-6xl leading-[1.45] mt-6">
        {CONFIG.couple.bride}
        <span className="block text-3xl sm:text-4xl text-amber leading-none -my-1">&amp;</span>
        {CONFIG.couple.groom}
      </h2>
      <p className="font-serif italic text-lg sm:text-xl mt-8">{t('rsvp.inviteRequest')}</p>
      <p className="font-display text-3xl sm:text-4xl leading-[1.7] mt-2 text-forest-deep">
        {guest.groupName}
      </p>
      <p className="font-serif italic text-lg sm:text-xl mt-1">{t('rsvp.inviteCelebrate')}</p>

      <div className="my-9">
        <Sprig />
      </div>

      <p className="font-sans text-xs sm:text-sm tracking-[0.3em] uppercase">{date}</p>
      <p className="font-serif text-lg mt-2">
        {t('rsvp.inviteTime', { time: CONFIG.wedding.time })}
      </p>
      <p className="font-serif text-xl sm:text-2xl mt-6">{CONFIG.wedding.venue}</p>
      <p className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-title/60 mt-2">
        Brasília · DF
      </p>

      <p className="font-serif italic text-title/70 mt-10">
        {t('rsvp.replyBy', { date: deadline })}
      </p>
      <button
        type="button"
        onClick={onReply}
        className={`group mt-5 inline-flex items-center gap-3 ${CTA}`}
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
  'w-full bg-transparent border-b border-forest-deep/20 py-2.5 font-serif text-base text-title placeholder:text-title/40 focus:outline-none focus:border-forest-deep/60 transition-colors'
const LABEL = 'font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title/80 block mb-2'

function ReplyForm({ guest, lang, onBack }: { guest: Guest; lang: Lang; onBack: () => void }) {
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
      <div className="text-center text-title">
        <p className="font-serif text-3xl sm:text-4xl tracking-[0.3em] pl-[0.3em]">
          {t('rsvp.replyTitle')}
        </p>
        <div className="my-8">
          <Sprig />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl">
          {alreadySubmitted ? t('rsvp.alreadyTitle') : t('rsvp.successTitle')}
        </h3>
        <p className="font-serif italic text-lg mt-4 mb-10">
          {alreadySubmitted ? t('rsvp.alreadySubmitted') : t('rsvp.successText')}
        </p>
        {backLink}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="text-title">
      <div className="text-center mb-8">
        <p className="font-serif text-3xl sm:text-4xl tracking-[0.3em] pl-[0.3em]">
          {t('rsvp.replyTitle')}
        </p>
        <p className="font-serif italic text-base sm:text-lg mt-3 text-title/80">
          {t('rsvp.letterOpening')}
        </p>
      </div>

      <div className="space-y-7">
        {attendees.map((attendee, i) => (
          <div key={i} className="border-t border-forest-deep/10 pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-3">
              <span className="font-serif text-xl sm:text-2xl">{attendee.name}</span>
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

        <div className="border-t border-forest-deep/10 pt-5">
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
      </div>

      {error && <p className="font-serif text-terracotta text-center mt-6">{error}</p>}

      <div className="text-center mt-10 flex flex-col items-center gap-6">
        <button
          type="submit"
          disabled={submitting}
          className={`${CTA} disabled:opacity-50 disabled:hover:translate-y-0`}
        >
          <span className={submitting ? 'animate-breath' : undefined}>
            {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
          </span>
        </button>
        {backLink}
      </div>
    </form>
  )
}
