import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'

interface Props {
  guest: Guest
}

function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    function update() {
      setDiff(new Date(targetDate).getTime() - Date.now())
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, isPast: diff <= 0 }
}

export function Welcome({ guest }: Props) {
  const { t } = useTranslation()
  const countdown = useCountdown(CONFIG.wedding.date)
  const photoSrc = guest.hasPhoto ? `/photos/${guest.guestId}.jpg` : '/photos/couple.jpg'

  const seatCount = guest.attendees.length

  return (
    <section id="welcome" className="relative min-h-screen flex flex-col">
      {/* Hero image */}
      <div className="relative flex-1 flex items-end justify-center min-h-screen overflow-hidden">
        <img
          src={photoSrc}
          alt={`${CONFIG.couple.bride} & ${CONFIG.couple.groom}`}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = '/photos/couple.jpg'
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-peach/20 via-transparent to-peach/90" />

        {/* Wildflower overlay top */}
        <WildflowerDecor variant="top" className="h-40 z-10" opacity={0.45} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 pb-16 w-full max-w-2xl mx-auto">
          <p className="font-sans text-xs tracking-widest uppercase text-forest/80 mb-3 animate-fade-in">
            {t('welcome.invitation')}
          </p>

          <h1 className="font-serif text-5xl md:text-7xl text-forest italic mb-2 animate-slide-up leading-tight">
            {CONFIG.couple.bride}
          </h1>
          <div className="font-serif text-2xl text-forest/50 mb-2">&</div>
          <h1 className="font-serif text-5xl md:text-7xl text-forest italic mb-6 animate-slide-up leading-tight">
            {CONFIG.couple.groom}
          </h1>

          <p className="font-serif text-xl text-forest/80 mb-8 animate-fade-in">
            {t('welcome.greeting', { name: guest.groupName })}
          </p>

          <p className="font-sans text-sm text-forest/70 mb-10 animate-fade-in">
            {seatCount === 1
              ? t('welcome.seats', { count: seatCount })
              : t('welcome.seats_plural', { count: seatCount })}
          </p>

          {/* Countdown */}
          {!countdown.isPast && (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-6 py-5 inline-block animate-fade-in">
              <p className="font-sans text-xs tracking-widest uppercase text-forest/60 mb-4">
                {t('welcome.countdown.title')}
              </p>
              <div className="flex gap-6 justify-center">
                {[
                  { value: countdown.days, label: t('welcome.countdown.days') },
                  { value: countdown.hours, label: t('welcome.countdown.hours') },
                  { value: countdown.minutes, label: t('welcome.countdown.minutes') },
                  { value: countdown.seconds, label: t('welcome.countdown.seconds') },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center min-w-[50px]">
                    <div className="font-serif text-3xl text-forest tabular-nums">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="font-sans text-xs text-mauve tracking-wider mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll indicator */}
          <div className="mt-10 animate-bounce">
            <svg className="mx-auto w-5 h-5 text-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom wildflowers */}
      <WildflowerDecor variant="bottom" className="absolute bottom-0 h-24 z-10" opacity={0.4} />
    </section>
  )
}
