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

// Drop more PNG/JPG files in public/flowers/ and add their filename here
// to extend the floating field. Order shapes which image appears in which
// slot — keep a mix so each rising column reads differently.
const FLOWER_IMAGES = [
  `${import.meta.env.BASE_URL}flowers/Dahlia_x3.png`,
  `${import.meta.env.BASE_URL}flowers/camomile_x3.png`,
  `${import.meta.env.BASE_URL}flowers/dahlia_x1.png`,
  `${import.meta.env.BASE_URL}flowers/flower_x1.png`,
  `${import.meta.env.BASE_URL}flowers/flower_x3.png`,
  `${import.meta.env.BASE_URL}flowers/purpel_flower_x3.png`,
  `${import.meta.env.BASE_URL}flowers/purple_flower_x1.png`,
  `${import.meta.env.BASE_URL}flowers/purple_flower_x2.png`,
  `${import.meta.env.BASE_URL}flowers/red_dahlia_x1.png`,
  `${import.meta.env.BASE_URL}flowers/red_dahlia_x3.png`,
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

          {/* Centered stack — SAVE THE DATE on top, then a comfortable gap,
              then date + countdown below it. Both groups sit near the
              vertical center of the viewport. Scroll ranges are widened
              so the per-letter cascade is unmistakable as you scroll. */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-16 px-6 text-center md:gap-24">
            <FlipLetters
              text={'SAVE\nTHE\nDATE'}
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.55}
              staggerRatio={0.95}
              scaleFrom={0.15}
              className="font-display text-forest-deep block text-6xl leading-[1] italic md:text-8xl lg:text-9xl"
              lineClassName="block"
            />

            <div className="flex flex-col items-center gap-6 md:gap-8">
              <FlipLetters
                text={dateLine}
                scrollProgress={scrollYProgress}
                scrollStart={0.55}
                scrollEnd={0.78}
                staggerRatio={0.9}
                scaleFrom={0.2}
                className="font-display text-forest-deep block text-4xl italic md:text-6xl"
              />

              <FlipLetters
                text={countdownText}
                scrollProgress={scrollYProgress}
                scrollStart={0.78}
                scrollEnd={0.95}
                staggerRatio={0.9}
                scaleFrom={0.3}
                className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
              />

              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.9}
                scrollEnd={1}
              >
                <p className="font-sans text-forest text-[0.6rem] tracking-[0.4em] uppercase">
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
