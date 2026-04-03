import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { submitRSVP } from '../../api/sheets'
import type { Guest, RSVPAttendee } from '../../types'
import { CONFIG } from '../../content.config'

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
    return (
      <section id="rsvp" className="relative bg-sage/20 py-24 overflow-hidden">
        <WildflowerDecor variant="top" className="h-16" opacity={0.25} />
        <div className="max-w-lg mx-auto px-6 text-center py-16">
          <div className="text-5xl mb-6">🌸</div>
          <h2 className="font-serif text-3xl text-forest italic mb-3">{t('rsvp.successTitle')}</h2>
          <p className="font-sans text-mauve">{t('rsvp.successText')}</p>
        </div>
        <WildflowerDecor variant="bottom" className="h-16" opacity={0.25} />
      </section>
    )
  }

  return (
    <section id="rsvp" className="relative bg-sage/20 py-24 overflow-hidden">
      <WildflowerDecor variant="top" className="h-16" opacity={0.25} />

      <div className="max-w-2xl mx-auto px-6 pt-8">
        <div className="text-center mb-12">
          <p className="font-sans text-xs tracking-widest uppercase text-amber mb-3">
            {t('nav.rsvp')}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-forest italic">{t('rsvp.title')}</h2>
          <p className="font-sans text-sm text-mauve mt-3">
            {t('rsvp.subtitle', { date: rsvpDeadline })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Attendees */}
          <div className="space-y-4">
            {attendees.map((attendee, i) => (
              <div key={i} className="bg-white/80 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-lg text-forest">{attendee.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateAttendee(i, 'attending', true)}
                      className={`px-4 py-1.5 rounded-full font-sans text-xs tracking-wide transition-colors ${
                        attendee.attending
                          ? 'bg-forest text-peach'
                          : 'border border-forest/30 text-forest/60 hover:border-forest/60'
                      }`}
                    >
                      {t('rsvp.attending')}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAttendee(i, 'attending', false)}
                      className={`px-4 py-1.5 rounded-full font-sans text-xs tracking-wide transition-colors ${
                        !attendee.attending
                          ? 'bg-mauve text-white'
                          : 'border border-mauve/30 text-mauve/60 hover:border-mauve/60'
                      }`}
                    >
                      {t('rsvp.notAttending')}
                    </button>
                  </div>
                </div>

                {attendee.attending && (
                  <div>
                    <label className="font-sans text-xs tracking-widest uppercase text-mauve block mb-2">
                      {t('rsvp.menu')}
                    </label>
                    <select
                      value={attendee.menu}
                      onChange={(e) => updateAttendee(i, 'menu', e.target.value)}
                      required={attendee.attending}
                      className="w-full px-4 py-2.5 rounded-xl border border-sage/40 bg-peach/30 font-sans text-sm text-forest focus:outline-none focus:border-forest/50 transition-colors"
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
          <div className="bg-white/80 rounded-2xl p-5">
            <label className="font-sans text-xs tracking-widest uppercase text-mauve block mb-2">
              {t('rsvp.song')}
            </label>
            <input
              type="text"
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
              placeholder={t('rsvp.songPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-sage/40 bg-peach/30 font-sans text-sm text-forest placeholder-mauve/40 focus:outline-none focus:border-forest/50 transition-colors"
            />
          </div>

          {/* Message */}
          <div className="bg-white/80 rounded-2xl p-5">
            <label className="font-sans text-xs tracking-widest uppercase text-mauve block mb-2">
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
              className="w-full px-4 py-2.5 rounded-xl border border-sage/40 bg-peach/30 font-sans text-sm text-forest placeholder-mauve/40 focus:outline-none focus:border-forest/50 transition-colors resize-none"
            />
          </div>

          {error && <p className="text-sm text-amber text-center font-sans">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-full bg-forest text-peach font-sans text-sm tracking-widest uppercase hover:bg-forest/90 transition-colors disabled:opacity-60"
          >
            {submitting ? t('rsvp.submitting') : t('rsvp.submit')}
          </button>
        </form>
      </div>

      <WildflowerDecor variant="bottom" className="h-16 mt-8" opacity={0.25} />
    </section>
  )
}
