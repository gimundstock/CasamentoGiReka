import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WildflowerDecor, WildflowerArch } from '../ui/WildflowerDecor'
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
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`
  const seatCount = guest.attendees.length

  const countdownItems = [
    { value: countdown.days, label: t('welcome.countdown.days') },
    { value: countdown.hours, label: t('welcome.countdown.hours') },
    { value: countdown.minutes, label: t('welcome.countdown.minutes') },
    { value: countdown.seconds, label: t('welcome.countdown.seconds') },
  ]

  return (
    <section
      id="welcome"
      className="relative min-h-screen bg-peach/60 overflow-hidden flex items-center"
    >
      {/* Corner wildflower accents */}
      <WildflowerDecor
        variant="scatter"
        className="absolute top-0 left-0 w-40 h-40 lg:w-56 lg:h-56"
        opacity={0.18}
      />
      <div className="absolute bottom-0 right-0 w-40 h-40 lg:w-56 lg:h-56 rotate-180">
        <WildflowerDecor variant="scatter" className="w-full h-full" opacity={0.18} />
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-6 py-24 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <p className="font-sans text-[0.7rem] tracking-[0.35em] uppercase text-amber mb-5 animate-fade-in">
            {t('welcome.invitation')}
          </p>

          <h1 className="font-serif italic text-forest leading-[0.95] mb-8 animate-slide-up">
            <span className="block text-6xl md:text-7xl lg:text-8xl">{CONFIG.couple.bride}</span>
            <span className="block font-serif not-italic text-3xl md:text-4xl text-forest/40 my-2 lg:my-3 tracking-widest">
              &
            </span>
            <span className="block text-6xl md:text-7xl lg:text-8xl">{CONFIG.couple.groom}</span>
          </h1>

          <div className="flex items-center justify-center lg:justify-start gap-4 mb-6 animate-fade-in">
            <div className="h-px w-10 bg-forest/30" />
            <p className="font-serif italic text-xl md:text-2xl text-forest/80">
              {t('welcome.greeting', { name: guest.groupName })}
            </p>
            <div className="h-px w-10 bg-forest/30 lg:hidden" />
          </div>

          <p className="font-sans text-sm text-mauve mb-10 tracking-wide animate-fade-in">
            {seatCount === 1
              ? t('welcome.seats', { count: seatCount })
              : t('welcome.seats_plural', { count: seatCount })}
          </p>

          {!countdown.isPast && (
            <div className="animate-fade-in inline-flex flex-col items-center lg:items-start">
              <p className="font-sans text-[0.65rem] tracking-[0.35em] uppercase text-forest/60 mb-3">
                {t('welcome.countdown.title')}
              </p>
              <div className="flex items-stretch divide-x divide-forest/20">
                {countdownItems.map(({ value, label }) => (
                  <div key={label} className="text-center px-4 md:px-5 first:pl-0 last:pr-0">
                    <div className="font-serif text-4xl md:text-5xl text-forest tabular-nums leading-none">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="font-sans text-[0.6rem] tracking-[0.2em] text-mauve uppercase mt-2">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: arched photo */}
        <div className="order-1 lg:order-2 flex justify-center animate-fade-in">
          <WildflowerArch imageSrc={photoSrc} imageAlt={altText} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-5 h-5 text-forest/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}
