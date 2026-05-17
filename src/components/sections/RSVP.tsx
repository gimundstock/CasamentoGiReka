import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { Bloom } from '../motion/Bloom'
import { Flower, Leaf, Garland, Petal } from '../botanicals'

const RSVP_STORAGE_KEY = 'wedding_rsvp_submitted'

interface Props {
  guest: Guest
}

// Tiny corner blossom rendered as its own inline svg, peeking out beyond
// the letter card edges. Each instance is its own coordinate space so it
// can sit at -top-3 / -left-3 without affecting the card layout.
function CardCornerFlower({
  className,
  rotation = 0,
  color = '#5A7956',
  variant = 'filler',
}: {
  className?: string
  rotation?: number
  color?: string
  variant?: 'daisy' | 'wild-rose' | 'cosmos' | 'anemone' | 'filler'
}) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <path
        d="M 6 34 C 12 24 18 18 24 14"
        stroke="#4E784F"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      <Leaf cx={14} cy={26} rotation={40} size={0.8} variant={2} fill="#ADB897" />
      <Flower cx={24} cy={14} variant={variant} size={0.5} color={color} animate={false} />
    </svg>
  )
}

// Tiny inline leaf icon embedded inside the attending pill / submit button.
function InlineLeaf({ className, fill = '#FAF3E3' }: { className?: string; fill?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g transform="translate(3 12) rotate(-20)">
        <path d="M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z" fill={fill} />
        <path
          d="M 1 1 Q 7 0 13 -2"
          stroke="#3F6041"
          strokeWidth={0.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      </g>
    </svg>
  )
}

// Hand-drawn separator drawn behind paragraphs — short curve with a tiny dot.
function Flourish({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="80"
      height="12"
      viewBox="0 0 80 12"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="mx-auto opacity-60"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <path
        d="M 4 6 C 22 1 44 11 76 6"
        stroke="#4E784F"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="76" cy="6" r="1.6" fill="#5A7956" />
    </svg>
  )
}

// Decorative blooms scattered around the success card.
const SUCCESS_FLOWERS: Array<{
  className: string
  variant: 'daisy' | 'wild-rose' | 'cosmos' | 'anemone' | 'filler'
  color: string
  size: number
  rotation: number
  delay: number
}> = [
  {
    className: '-top-6 -left-4',
    variant: 'daisy',
    color: '#A39584',
    size: 1.2,
    rotation: -15,
    delay: 0.1,
  },
  {
    className: '-top-4 right-6',
    variant: 'wild-rose',
    color: '#9A7F84',
    size: 1.1,
    rotation: 18,
    delay: 0.3,
  },
  {
    className: 'top-1/3 -left-7',
    variant: 'cosmos',
    color: '#AA9DA9',
    size: 1,
    rotation: -8,
    delay: 0.5,
  },
  {
    className: 'top-1/2 -right-6',
    variant: 'filler',
    color: '#5A7956',
    size: 0.9,
    rotation: 12,
    delay: 0.7,
  },
  {
    className: '-bottom-5 left-10',
    variant: 'anemone',
    color: '#9A7F84',
    size: 1,
    rotation: 22,
    delay: 0.4,
  },
  {
    className: '-bottom-6 right-12',
    variant: 'daisy',
    color: '#A39584',
    size: 1.1,
    rotation: -20,
    delay: 0.6,
  },
  {
    className: 'bottom-8 -right-4',
    variant: 'filler',
    color: '#ADB897',
    size: 0.8,
    rotation: 0,
    delay: 0.8,
  },
]

// Tiny drifting petals overlaid on the success card.
const SUCCESS_PETALS: Array<{
  left: string
  delay: string
  color: string
  rotation: number
  size: number
}> = [
  { left: '8%', delay: '0s', color: '#C3CBB2', rotation: 12, size: 12 },
  { left: '18%', delay: '2.4s', color: '#5A7956', rotation: -8, size: 10 },
  { left: '28%', delay: '5.1s', color: '#AA9DA9', rotation: 28, size: 11 },
  { left: '40%', delay: '1.2s', color: '#9A7F84', rotation: -18, size: 13 },
  { left: '52%', delay: '3.6s', color: '#C3CBB2', rotation: 6, size: 12 },
  { left: '64%', delay: '0.6s', color: '#A39584', rotation: -22, size: 10 },
  { left: '74%', delay: '4.2s', color: '#ADB897', rotation: 14, size: 11 },
  { left: '86%', delay: '2.1s', color: '#C3CBB2', rotation: -10, size: 12 },
]

// Shared paper letter card wrapper used by all three states.
function LetterCard({ children }: { children: React.ReactNode }) {
  return (
    <RevealOnScroll>
      <div className="relative mx-auto max-w-2xl">
        <div className="relative rounded-3xl border border-sage/40 bg-peach-light/85 p-6 sm:p-8 md:p-12 shadow-[0_8px_40px_rgba(78,120,79,0.10)] overflow-visible">
          <div
            className="absolute inset-0 bg-paper opacity-30 pointer-events-none rounded-3xl"
            aria-hidden
          />

          {/* Peek-out corner blossoms */}
          <CardCornerFlower className="absolute -top-3 -left-3" rotation={0} />
          <CardCornerFlower
            className="absolute -top-3 -right-3"
            rotation={90}
            color="#9A7F84"
            variant="filler"
          />

          <div className="relative">{children}</div>
        </div>
      </div>
    </RevealOnScroll>
  )
}

// Shared section shell — layered washes, garlands top and bottom.
function SectionShell({ children }: { children: React.ReactNode }) {
  return (
    <section id="rsvp" className="relative overflow-hidden py-24 md:py-32 bg-peach-light">
      <div className="absolute inset-0 bg-wash-peach opacity-50 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none" aria-hidden />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none opacity-50"
        aria-hidden
      >
        <Garland density="medium" width={1200} height={120} />
      </div>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 rotate-180"
        aria-hidden
      >
        <Garland density="medium" width={1200} height={120} />
      </div>

      <div className="relative z-10 px-4 sm:px-6">{children}</div>
    </section>
  )
}

export function RSVP({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const alreadySubmitted = localStorage.getItem(`${RSVP_STORAGE_KEY}_${guest.guestId}`) === 'true'

  const [attendees, setAttendees] = useState<RSVPAttendee[]>(
    guest.attendees.map((name) => ({ name, attending: true, menu: '' }))
  )
  const [songRequest, setSongRequest] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [error, setError] = useState<string | null>(null)

  const rsvpDeadline = new Date(CONFIG.wedding.rsvpDeadline).toLocaleDateString(
    lang === 'pt' ? 'pt-BR' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  function updateAttendee(index: number, field: keyof RSVPAttendee, value: string | boolean) {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await submitRSVP({ guestId: guest.guestId, attendees, songRequest, message })
      localStorage.setItem(`${RSVP_STORAGE_KEY}_${guest.guestId}`, 'true')
      setSubmitted(true)
    } catch {
      setError(t('rsvp.error'))
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Success / alreadySubmitted ----------
  if (submitted) {
    const isAlready = alreadySubmitted
    const title = isAlready ? t('rsvp.alreadyTitle') : t('rsvp.successTitle')
    const body = isAlready ? t('rsvp.alreadySubmitted') : t('rsvp.successText')

    return (
      <SectionShell>
        <div className="text-center mb-12">
          <p className="font-sans text-[0.7rem] tracking-[0.35em] uppercase text-amber mb-3">
            {t('rsvp.kicker')}
          </p>
          <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep leading-tight">
            {t('rsvp.title')}
          </h2>
        </div>

        <LetterCard>
          <div className="relative overflow-hidden">
            {/* Drifting petals across the card */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              {SUCCESS_PETALS.map((p, i) => (
                <span
                  key={`petal-${i}`}
                  className="absolute top-0 animate-drift-down"
                  style={{ left: p.left, animationDelay: p.delay }}
                >
                  <Petal color={p.color} size={p.size} rotation={p.rotation} />
                </span>
              ))}
            </div>

            {/* Decorative blooms around the message */}
            {!isAlready &&
              SUCCESS_FLOWERS.map((f, i) => (
                <span
                  key={`bloom-${i}`}
                  className={`pointer-events-none absolute ${f.className}`}
                  aria-hidden
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: `rotate(${f.rotation}deg)` }}
                  >
                    <Bloom delay={f.delay}>
                      <g transform="translate(24 24)">
                        <Flower
                          cx={0}
                          cy={0}
                          variant={f.variant}
                          size={f.size}
                          color={f.color}
                          animate={false}
                        />
                      </g>
                    </Bloom>
                  </svg>
                </span>
              ))}

            {isAlready && (
              <span className="pointer-events-none absolute -top-2 right-8" aria-hidden>
                <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <Flower
                    cx={24}
                    cy={24}
                    variant="cosmos"
                    size={1}
                    color="#AA9DA9"
                    animate={false}
                  />
                </svg>
              </span>
            )}

            <div className="relative text-center py-6">
              <h3 className="font-display italic text-3xl text-forest-deep mb-4">{title}</h3>
              <Flourish />
              <p className="font-serif text-lg text-forest/80 mt-4 italic">{body}</p>
            </div>
          </div>
        </LetterCard>
      </SectionShell>
    )
  }

  // ---------- Form ----------
  return (
    <SectionShell>
      <div className="text-center mb-12">
        <p className="font-sans text-[0.7rem] tracking-[0.35em] uppercase text-amber mb-3">
          {t('rsvp.kicker')}
        </p>
        <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep leading-tight">
          {t('rsvp.title')}
        </h2>
        <p className="font-serif italic text-mauve text-base sm:text-lg md:text-xl mt-4">
          {t('rsvp.subtitle', { date: rsvpDeadline })}
        </p>
      </div>

      <LetterCard>
        <p className="font-serif italic text-forest/70 text-base mb-6">{t('rsvp.letterOpening')}</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Attendees — paper-light cards with pill toggles */}
          <div className="space-y-5">
            {attendees.map((attendee, i) => (
              <div
                key={i}
                className="rounded-2xl border border-sage/30 bg-white/60 p-5 md:p-6 backdrop-blur-[1px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <span className="font-display italic text-2xl text-forest-deep">
                    {attendee.name}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateAttendee(i, 'attending', true)}
                      aria-pressed={attendee.attending}
                      className={`group inline-flex items-center gap-2 rounded-full px-5 py-2 font-sans text-[0.7rem] tracking-widest uppercase transition-all ${
                        attendee.attending
                          ? 'bg-forest-deep text-peach-light shadow-sm'
                          : 'border border-sage/40 text-forest/60 bg-transparent hover:border-forest/40'
                      }`}
                    >
                      {attendee.attending && <InlineLeaf fill="#FAF3E3" />}
                      {t('rsvp.attending')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAttendee(i, 'attending', false)}
                      aria-pressed={!attendee.attending}
                      className={`rounded-full px-5 py-2 font-sans text-[0.7rem] tracking-widest uppercase transition-all ${
                        !attendee.attending
                          ? 'bg-mauve text-peach-light shadow-sm'
                          : 'border border-sage/40 text-forest/60 bg-transparent hover:border-forest/40'
                      }`}
                    >
                      {t('rsvp.notAttending')}
                    </button>
                  </div>
                </div>

                {attendee.attending && (
                  <div className="mt-4">
                    <label className="font-serif italic text-mauve text-sm block mb-2">
                      {t('rsvp.menu')}
                    </label>
                    <select
                      value={attendee.menu}
                      onChange={(e) => updateAttendee(i, 'menu', e.target.value)}
                      required={attendee.attending}
                      className="w-full px-4 py-3 rounded-2xl border border-sage/40 bg-white/70 font-sans text-sm text-forest-deep focus:outline-none focus:border-forest/60 focus:ring-2 focus:ring-forest/10 transition-colors"
                    >
                      <option value="">{t('rsvp.menuPlaceholder')}</option>
                      {CONFIG.menuOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {lang === 'pt' ? opt.pt : opt.en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Song request */}
          <div>
            <label className="font-serif italic text-mauve text-sm block mb-2">
              {t('rsvp.song')}
            </label>
            <input
              type="text"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
              placeholder={t('rsvp.songPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl border border-sage/40 bg-white/70 font-sans text-sm text-forest-deep placeholder:italic placeholder:text-mauve-light focus:outline-none focus:border-forest/60 focus:ring-2 focus:ring-forest/10 transition-colors"
            />
          </div>

          {/* Message */}
          <div>
            <label className="font-serif italic text-mauve text-sm block mb-2">
              {t('rsvp.message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('rsvp.messagePlaceholder', {
                bride: CONFIG.couple.bride,
                groom: CONFIG.couple.groom,
              })}
              rows={4}
              className="w-full px-4 py-3 rounded-2xl border border-sage/40 bg-white/70 font-sans text-sm text-forest-deep placeholder:italic placeholder:text-mauve-light focus:outline-none focus:border-forest/60 focus:ring-2 focus:ring-forest/10 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="relative rounded-2xl border border-terracotta/40 bg-white/60 px-4 py-3">
              <span className="pointer-events-none absolute -top-3 -left-3" aria-hidden>
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <Flower
                    cx={16}
                    cy={16}
                    variant="filler"
                    size={0.7}
                    color="#9A7F84"
                    animate={false}
                  />
                </svg>
              </span>
              <p className="font-serif italic text-terracotta text-sm text-center">
                <span className="not-italic font-sans tracking-widest uppercase text-[0.65rem] block mb-1 text-terracotta/80">
                  {t('rsvp.errorTitle')}
                </span>
                {error}
              </p>
            </div>
          )}

          {/* Letter closing + CTA */}
          <div className="pt-2 flex flex-col items-center gap-5">
            <p className="font-serif italic text-forest/70 text-base">{t('rsvp.letterClose')},</p>

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex items-center gap-3 rounded-full bg-forest-deep px-10 py-4 font-sans text-sm tracking-widest uppercase text-peach-light hover:bg-forest-deep/90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(223,177,0,0.25)] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              <span className={submitting ? 'animate-breath' : undefined}>
                {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
              </span>
              <InlineLeaf
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                fill="#FAF3E3"
              />
            </button>
          </div>
        </form>
      </LetterCard>
    </SectionShell>
  )
}
