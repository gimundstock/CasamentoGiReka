import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { LetterFlock } from '../motion/LetterFlock'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { useArmedOnScroll } from '../motion/useArmedOnScroll'

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
  const { t, i18n } = useTranslation()
  const countdown = useCountdown(CONFIG.wedding.date)
  const armed = useArmedOnScroll()

  const base = import.meta.env.BASE_URL
  const photoSrc = guest.hasPhoto
    ? `${base}photos/${guest.guestId}.jpg`
    : `${base}photos/couple.jpg`
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`
  const seatCount = guest.attendees.length

  const countdownItems = [
    { value: countdown.days, label: t('welcome.countdown.days') },
    { value: countdown.hours, label: t('welcome.countdown.hours') },
    { value: countdown.minutes, label: t('welcome.countdown.minutes') },
    { value: countdown.seconds, label: t('welcome.countdown.seconds') },
  ]

  const weddingDate = new Date(CONFIG.wedding.date)
  const dateLine = weddingDate
    .toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()

  return (
    <section
      id="welcome"
      className="relative min-h-screen bg-peach flex flex-col items-center justify-center px-6 py-32 md:py-40"
    >
      <div className="w-full max-w-5xl mx-auto text-center">
        <MaskReveal direction="up" delay={0} play={armed}>
          <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-12 md:mb-16">
            {t('welcome.invitation')}
          </p>
        </MaskReveal>

        <h1 className="font-display italic text-forest-deep leading-[0.95]">
          <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">
            <LetterFlock text={CONFIG.couple.bride} delay={0.2} stagger={0.04} play={armed} />
          </span>
          <MaskReveal direction="up" delay={0.9} play={armed}>
            <span className="block font-display not-italic text-xl sm:text-2xl md:text-3xl text-mauve tracking-[0.6em] my-4 md:my-6">
              &amp;
            </span>
          </MaskReveal>
          <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">
            <LetterFlock text={CONFIG.couple.groom} delay={1.1} stagger={0.04} play={armed} />
          </span>
        </h1>

        <div className="mt-14 md:mt-20">
          <MaskReveal direction="up" delay={1.8} play={armed}>
            <div className="mx-auto w-px h-12 bg-forest-deep/30 mb-6" />
            <p className="font-display italic text-2xl md:text-3xl text-forest-deep mb-2">
              {dateLine}
            </p>
            <p className="font-serif italic text-lg md:text-xl text-forest">
              {t('welcome.greeting', { name: guest.groupName })}
            </p>
            <p className="mt-3 font-sans text-[0.65rem] tracking-[0.3em] uppercase text-forest/70">
              {seatCount === 1
                ? t('welcome.seats', { count: seatCount })
                : t('welcome.seats_plural', { count: seatCount })}
            </p>
          </MaskReveal>
        </div>
      </div>

      <RevealOnScroll delay={0.3} className="w-full max-w-3xl mx-auto mt-24 md:mt-32">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={photoSrc}
            alt={altText}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
            }}
          />
        </div>
      </RevealOnScroll>

      {!countdown.isPast && (
        <RevealOnScroll delay={0.2} className="w-full max-w-3xl mx-auto mt-24 md:mt-32">
          <div className="text-center">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-10">
              {t('welcome.countdown.title')}
            </p>
            <div className="flex items-stretch justify-center gap-6 md:gap-12">
              {countdownItems.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display text-5xl md:text-7xl text-forest-deep tabular-nums leading-none">
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="font-sans text-[0.55rem] md:text-[0.6rem] tracking-[0.35em] text-forest uppercase mt-3">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      )}
    </section>
  )
}
