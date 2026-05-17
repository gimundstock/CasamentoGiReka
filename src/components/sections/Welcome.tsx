import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useScroll } from 'framer-motion'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { LetterFlock } from '../motion/LetterFlock'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'

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

  // The hero locks for ~100vh of scroll while the entrance plays. The
  // outer stage is 200vh tall; the inner stage is sticky and pinned to
  // the viewport. useScroll maps stage progress 0→1 across the locked
  // 100vh so the animation is the scroll.
  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

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
    <section id="welcome" className="relative bg-peach">
      {/* Locked stage — 200vh of scroll, inner content pinned to viewport */}
      <div ref={stageRef} className="relative h-[200vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-6">
          <div className="mx-auto w-full max-w-5xl text-center">
            <MaskReveal direction="up" scrollProgress={scrollYProgress} scrollEnd={0.12}>
              <p className="font-sans text-forest mb-12 text-[0.65rem] tracking-[0.4em] uppercase md:mb-16">
                {t('welcome.invitation')}
              </p>
            </MaskReveal>

            <h1 className="font-display text-forest-deep leading-[0.95] italic">
              <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">
                <LetterFlock
                  text={CONFIG.couple.bride}
                  scrollProgress={scrollYProgress}
                  scrollSpan={0.35}
                />
              </span>
              <MaskReveal direction="up" scrollProgress={scrollYProgress} scrollEnd={0.55}>
                <span className="font-display text-mauve my-4 block text-xl tracking-[0.6em] not-italic sm:text-2xl md:my-6 md:text-3xl">
                  &amp;
                </span>
              </MaskReveal>
              <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[9rem]">
                <LetterFlock
                  text={CONFIG.couple.groom}
                  scrollProgress={scrollYProgress}
                  scrollSpan={0.35}
                />
              </span>
            </h1>

            <div className="mt-14 md:mt-20">
              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.7}
                scrollEnd={0.92}
              >
                <div className="bg-forest-deep/30 mx-auto mb-6 h-12 w-px" />
                <p className="font-display text-forest-deep mb-2 text-2xl italic md:text-3xl">
                  {dateLine}
                </p>
                <p className="font-serif text-forest text-lg italic md:text-xl">
                  {t('welcome.greeting', { name: guest.groupName })}
                </p>
                <p className="font-sans text-forest/70 mt-3 text-[0.65rem] tracking-[0.3em] uppercase">
                  {seatCount === 1
                    ? t('welcome.seats', { count: seatCount })
                    : t('welcome.seats_plural', { count: seatCount })}
                </p>
              </MaskReveal>
            </div>
          </div>
        </div>
      </div>

      {/* After the lock releases, normal flow continues with the photo and countdown */}
      <div className="px-6 pt-24 pb-24 md:pt-32 md:pb-32">
        <RevealOnScroll className="mx-auto w-full max-w-3xl">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={photoSrc}
              alt={altText}
              className="h-full w-full object-cover"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement
                el.style.display = 'none'
              }}
            />
          </div>
        </RevealOnScroll>
      </div>

      {!countdown.isPast && (
        <div className="px-6 pb-32 md:pb-40">
          <RevealOnScroll className="mx-auto w-full max-w-3xl">
            <div className="text-center">
              <p className="font-sans text-forest mb-10 text-[0.65rem] tracking-[0.4em] uppercase">
                {t('welcome.countdown.title')}
              </p>
              <div className="flex items-stretch justify-center gap-6 md:gap-12">
                {countdownItems.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-display text-forest-deep text-5xl leading-none tabular-nums md:text-7xl">
                      {String(value).padStart(2, '0')}
                    </div>
                    <div className="font-sans text-forest mt-3 text-[0.55rem] tracking-[0.35em] uppercase md:text-[0.6rem]">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      )}
    </section>
  )
}
