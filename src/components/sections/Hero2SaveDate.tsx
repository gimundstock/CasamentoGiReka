import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  `${import.meta.env.BASE_URL}flowers/Dahlia_x3.png`,
  `${import.meta.env.BASE_URL}flowers/camomile_x3.png`,
  `${import.meta.env.BASE_URL}flowers/dahlia_x1.png`,
  `${import.meta.env.BASE_URL}flowers/flower_x1.png`,
  `${import.meta.env.BASE_URL}flowers/flower_x3.png`,
  `${import.meta.env.BASE_URL}flowers/purpel_flower_x3.png`,
  `${import.meta.env.BASE_URL}flowers/purple_flower_x1.png`,
  `${import.meta.env.BASE_URL}flowers/purple_flower_x2.png`,
  `${import.meta.env.BASE_URL}flowers/red_dahlia_x1.png`,
]

const DAHLIA_HERO_SRC = `${import.meta.env.BASE_URL}flowers/red_dahlia_x3.png`

/**
 * Hero 2 — "Save the Date".
 *
 * Scroll-pinned stage (300vh outer, sticky inner). Choreography:
 *
 *   0.00 → 0.35  SAVE / THE / DATE letters scatter-collect
 *   0.35 → 0.55  date line scatter-collects
 *   0.55 → 0.70  countdown digits scatter-collect
 *   0.65 → 0.75  countdown labels mask-reveal
 *   ──── all save-the-date content shown ────
 *   0.75 → 1.00  red dahlia grows from the center of the screen
 *                (scale 0 → 1.2 with a subtle scroll-driven spin)
 *   0.88 → 1.00  text fades out so the dahlia owns the frame
 *
 * By scroll progress 1, the dahlia fills the viewport. It then carries
 * into Hero 3 as the section backdrop — the visual handoff is the same
 * photographic flower in both sections.
 */
export function Hero2SaveDate() {
  const { t, i18n } = useTranslation()
  const countdown = useCountdown(CONFIG.wedding.date)

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  // Dahlia grows from a point at the center to viewport-overflowing size
  // as the user scrolls through the final stretch of the hero. A subtle
  // rotation makes the bloom feel alive while it expands.
  const dahliaScale = useTransform(scrollYProgress, [0.75, 1], [0, 1.2])
  const dahliaRotate = useTransform(scrollYProgress, [0.75, 1], [-20, 0])
  // Save-the-date copy fades out just before the dahlia covers everything.
  const textOpacity = useTransform(scrollYProgress, [0.88, 1], [1, 0])

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
          {/* Background flower field — rises behind everything */}
          <FloatField
            scrollProgress={scrollYProgress}
            count={30}
            variant="image"
            images={FLOWER_IMAGES}
            sizeMin={70}
            sizeMax={140}
          />

          {/* Hero dahlia — grows from a center point to fill the viewport
              at the end of the scroll. Behind the text but in front of the
              rising flower field. */}
          <motion.img
            src={DAHLIA_HERO_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-screen w-screen -translate-x-1/2 -translate-y-1/2"
            style={{
              objectFit: 'contain',
              scale: dahliaScale,
              rotate: dahliaRotate,
              willChange: 'transform',
            }}
          />

          {/* Foreground text — scatter-collects in, then fades out as the
              dahlia takes over the frame. */}
          <motion.div
            className="relative z-20 flex h-full flex-col items-center justify-center gap-16 px-6 text-center md:gap-24"
            style={{ opacity: textOpacity }}
          >
            <FlipLetters
              text={'SAVE\nTHE\nDATE'}
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.35}
              staggerRatio={0.95}
              scaleFrom={0.15}
              className="font-display text-forest-deep block text-6xl leading-[1] italic md:text-8xl lg:text-9xl"
              lineClassName="block"
            />

            <div className="flex flex-col items-center gap-6 md:gap-8">
              <FlipLetters
                text={dateLine}
                scrollProgress={scrollYProgress}
                scrollStart={0.35}
                scrollEnd={0.55}
                staggerRatio={0.9}
                scaleFrom={0.2}
                className="font-display text-forest-deep block text-4xl italic md:text-6xl"
              />

              <FlipLetters
                text={countdownText}
                scrollProgress={scrollYProgress}
                scrollStart={0.55}
                scrollEnd={0.7}
                staggerRatio={0.9}
                scaleFrom={0.3}
                className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
              />

              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.65}
                scrollEnd={0.75}
              >
                <p className="font-sans text-forest text-[0.6rem] tracking-[0.4em] uppercase">
                  {t('welcome.countdown.days')} · {t('welcome.countdown.hours')} ·{' '}
                  {t('welcome.countdown.minutes')} · {t('welcome.countdown.seconds')}
                </p>
              </MaskReveal>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
