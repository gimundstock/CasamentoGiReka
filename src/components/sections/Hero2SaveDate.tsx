import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useScroll } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { FlipLetters } from '../motion/FlipLetters'
import { FloatField } from '../motion/FloatField'
import { MaskReveal } from '../motion/MaskReveal'

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

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

/**
 * Hero 2 — "Save the Date".
 *
 * Scroll-pinned stage (300vh outer, sticky inner): petals rise behind the
 * text while three lines of FlipLetters fan in across the scroll window —
 * the "SAVE THE DATE" headline (0 → 0.35), the date line (0.35 → 0.65),
 * and the countdown digits (0.65 → 0.95). Labels mask-reveal at the very
 * end (0.85 → 1).
 *
 * The countdown stays live: a setInterval tick updates the underlying
 * digits every second. FlipLetters in scroll-driven mode interpolates each
 * letter by scroll position, so once progress is past `scrollEnd` (0.95)
 * every letter is at its final rotation/opacity and digit swaps appear
 * cleanly without re-triggering the flip animation.
 */
export function Hero2SaveDate() {
  const { t, i18n } = useTranslation()
  const countdown = useCountdown(CONFIG.wedding.date)

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  const weddingDate = new Date(CONFIG.wedding.date)
  const dateLine = weddingDate
    .toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(/\./g, '')

  const countdownText = `${pad(countdown.days, 3)} : ${pad(countdown.hours, 2)} : ${pad(
    countdown.minutes,
    2
  )} : ${pad(countdown.seconds, 2)}`

  return (
    <section id="save-the-date" className="relative bg-peach">
      <div ref={stageRef} className="relative h-[300vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <FloatField scrollProgress={scrollYProgress} count={14} variant="petal" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
            <FlipLetters
              text={'SAVE\nTHE\nDATE'}
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.35}
              staggerRatio={0.6}
              className="font-display text-forest-deep block text-6xl leading-[0.95] italic md:text-8xl lg:text-9xl"
              lineClassName="block"
            />

            <div className="mt-10 md:mt-14">
              <FlipLetters
                text={dateLine}
                scrollProgress={scrollYProgress}
                scrollStart={0.35}
                scrollEnd={0.65}
                staggerRatio={0.5}
                className="font-display text-forest-deep block text-4xl italic md:text-6xl"
              />
            </div>

            <div className="mt-10 md:mt-14">
              <FlipLetters
                text={countdownText}
                scrollProgress={scrollYProgress}
                scrollStart={0.65}
                scrollEnd={0.95}
                staggerRatio={0.5}
                className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
              />
              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.85}
                scrollEnd={1}
              >
                <p className="font-sans text-forest mt-4 text-[0.6rem] tracking-[0.4em] uppercase">
                  {t('welcome.countdown.days')} · {t('welcome.countdown.hours')} ·{' '}
                  {t('welcome.countdown.minutes')} · {t('welcome.countdown.seconds')}
                </p>
              </MaskReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
