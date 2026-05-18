import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'

const RSVP_STORAGE_KEY = 'wedding_rsvp_submitted'

interface Props {
  guest: Guest
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

  if (submitted) {
    const isAlready = alreadySubmitted
    const title = isAlready ? t('rsvp.alreadyTitle') : t('rsvp.successTitle')
    const body = isAlready ? t('rsvp.alreadySubmitted') : t('rsvp.successText')

    return (
      <section id="rsvp" className="bg-peach py-32 md:py-48">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <MaskReveal direction="up">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-amber mb-6">
              {t('rsvp.kicker')}
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl text-forest-deep mb-12">
              {title}
            </h2>
            <p className="font-serif italic text-lg md:text-xl text-forest leading-relaxed">
              {body}
            </p>
          </MaskReveal>
        </div>
      </section>
    )
  }

  return (
    <section id="rsvp" className="bg-peach py-32 md:py-48">
      <div className="max-w-2xl mx-auto px-6">
        <MaskReveal direction="up" delay={0.05}>
          <div className="text-center mb-20 md:mb-24">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-amber mb-6">
              {t('rsvp.kicker')}
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl text-forest-deep">
              {t('rsvp.title')}
            </h2>
            <p className="font-serif italic text-mauve text-lg md:text-xl mt-6">
              {t('rsvp.subtitle', { date: rsvpDeadline })}
            </p>
          </div>
        </MaskReveal>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-12">
            {attendees.map((attendee, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className="border-t border-forest-deep/15 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-6">
                    <span className="font-display italic text-2xl md:text-3xl text-forest-deep">
                      {attendee.name}
                    </span>

                    <div className="flex gap-3 text-[0.65rem] tracking-[0.35em] uppercase font-sans">
                      <button
                        type="button"
                        onClick={() => updateAttendee(i, 'attending', true)}
                        aria-pressed={attendee.attending}
                        className={`pb-1 border-b transition-colors ${
                          attendee.attending
                            ? 'text-forest-deep border-forest-deep'
                            : 'text-forest/50 border-transparent hover:text-forest-deep'
                        }`}
                      >
                        {t('rsvp.attending')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAttendee(i, 'attending', false)}
                        aria-pressed={!attendee.attending}
                        className={`pb-1 border-b transition-colors ${
                          !attendee.attending
                            ? 'text-forest-deep border-forest-deep'
                            : 'text-forest/50 border-transparent hover:text-forest-deep'
                        }`}
                      >
                        {t('rsvp.notAttending')}
                      </button>
                    </div>
                  </div>

                  {attendee.attending && (
                    <select
                      value={attendee.menu}
                      onChange={(e) => updateAttendee(i, 'menu', e.target.value)}
                      required={attendee.attending}
                      className="w-full bg-transparent border-b border-forest-deep/20 py-3 font-serif italic text-base text-forest-deep focus:outline-none focus:border-forest-deep/60 transition-colors"
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
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="border-t border-forest-deep/15 pt-8">
              <label className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest block mb-3">
                {t('rsvp.song')}
              </label>
              <input
                type="text"
                value={songRequest}
                onChange={(e) => setSongRequest(e.target.value)}
                placeholder={t('rsvp.songPlaceholder')}
                className="w-full bg-transparent border-b border-forest-deep/20 py-3 font-serif italic text-base text-forest-deep placeholder:text-forest/40 focus:outline-none focus:border-forest-deep/60 transition-colors"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="border-t border-forest-deep/15 pt-8">
              <label className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest block mb-3">
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
                className="w-full bg-transparent border-b border-forest-deep/20 py-3 font-serif italic text-base text-forest-deep placeholder:text-forest/40 focus:outline-none focus:border-forest-deep/60 transition-colors resize-none"
              />
            </div>
          </RevealOnScroll>

          {error && <p className="font-serif italic text-terracotta text-center">{error}</p>}

          <div className="text-center pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="bg-forest-deep text-peach-light font-sans inline-block px-14 py-4 text-xs tracking-[0.35em] uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <span className={submitting ? 'animate-breath' : undefined}>
                {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
