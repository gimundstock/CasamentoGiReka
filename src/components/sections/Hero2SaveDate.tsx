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

const FLOWER_IMAGES = [
  `${import.meta.env.BASE_URL}flowers/flower1.svg`,
  `${import.meta.env.BASE_URL}flowers/flower2.svg`,
  `${import.meta.env.BASE_URL}flowers/flower3.svg`,
  `${import.meta.env.BASE_URL}flowers/flower4.svg`,
  `${import.meta.env.BASE_URL}flowers/flower5.svg`,
]

/**
 * Hero 2 — "Save the Date".
 *
 * Scroll-pinned stage (300vh outer, sticky inner): flower images rise
 * behind the text while the SAVE THE DATE headline flips in at the top
 * of the viewport, and the date + countdown flip in at the bottom.
 *
 * Each FlipLetters block uses a strong stagger (0.9) so the per-letter
 * cascade is visible, and grows letters from scale 0.2 → 1 as they
 * scroll into their range so the assembly reads as a continuous swell.
 *
 * The countdown stays live: a setInterval tick updates the underlying
 * digits every second. FlipLetters in scroll-driven mode interpolates
 * each letter by scroll position, so once progress is past `scrollEnd`
 * every letter sits at its final transform and new digit characters
 * just slot in without re-triggering the flip.
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
          <FloatField
            scrollProgress={scrollYProgress}
            count={16}
            variant="image"
            images={FLOWER_IMAGES}
            sizeMin={36}
            sizeMax={72}
          />

          <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 py-16 text-center md:py-24">
            {/* TOP: SAVE / THE / DATE */}
            <FlipLetters
              text={'SAVE\nTHE\nDATE'}
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.45}
              staggerRatio={0.9}
              scaleFrom={0.2}
              className="font-display text-forest-deep block text-6xl leading-[0.95] italic md:text-8xl lg:text-9xl"
              lineClassName="block"
            />

            {/* BOTTOM: date + countdown */}
            <div className="flex flex-col items-center gap-8 md:gap-10">
              <FlipLetters
                text={dateLine}
                scrollProgress={scrollYProgress}
                scrollStart={0.45}
                scrollEnd={0.7}
                staggerRatio={0.85}
                scaleFrom={0.25}
                className="font-display text-forest-deep block text-4xl italic md:text-6xl"
              />

              <div className="flex flex-col items-center">
                <FlipLetters
                  text={countdownText}
                  scrollProgress={scrollYProgress}
                  scrollStart={0.7}
                  scrollEnd={0.95}
                  staggerRatio={0.85}
                  scaleFrom={0.3}
                  className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
                />
                <MaskReveal
                  direction="up"
                  scrollProgress={scrollYProgress}
                  scrollStart={0.88}
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
      </div>
    </section>
  )
}
