import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { FlipLetters } from '../motion/FlipLetters'
import { FloatField } from '../motion/FloatField'
import { MaskReveal } from '../motion/MaskReveal'
import { RisingCard } from '../motion/RisingCard'

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
const DAHLIA_ANCHOR_SRC = `${import.meta.env.BASE_URL}flowers/Dahlia_x3.png`

/**
 * Combined Save-the-Date → Meet-the-Couple hero.
 *
 * One pinned section. The red dahlia is a single persistent DOM element
 * across the whole flow, so there's no section boundary where it could
 * appear in two places at once. Save-the-date copy cross-fades to the
 * couple's "Our Story" heading inside the same sticky stage, then the
 * photo cascade plays past the still-present dahlia, and finally the
 * dahlia zooms to fill the screen on the way out to "The Big Day".
 *
 * Outer is h-[700vh] giving 600vh of locked scroll. Generous, but the
 * pinned content makes the time feel like one continuous moment rather
 * than a long scroll.
 *
 * Scroll choreography (progress 0 → 1):
 *   0.00 → 0.13  SAVE / THE / DATE letters scatter-collect
 *   0.13 → 0.20  date line scatter-collects
 *   0.20 → 0.27  countdown digits scatter-collect
 *   0.24 → 0.30  countdown labels mask-reveal
 *   0.30 → 0.40  red dahlia grows from scale 0 → 1 (-20° → 0° unwind)
 *   0.40 → 0.46  save-the-date content fades out (text + anchor + field)
 *   0.43 → 0.48  "OUR STORY / The Couple" heading fades in
 *   0.50 → 0.85  photo cascade (RisingCards staggered across this range)
 *   0.85 → 1.00  dahlia zooms scale 1 → 6, transitioning to WeddingInfo
 */
export function HeroSaveDateCouple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const countdown = useCountdown(CONFIG.wedding.date)

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  // Dahlia: stays at 0 through the text reveal, grows 0.30 → 0.40, holds
  // at 1 through the cross-fade and cascade, then zooms to 6 during the
  // final ZoomMorph phase. Multi-keyframe keeps it as ONE motion value.
  const dahliaScale = useTransform(scrollYProgress, [0, 0.3, 0.4, 0.85, 1], [0, 0, 1, 1, 6])
  const dahliaRotate = useTransform(scrollYProgress, [0.3, 0.4], [-20, 0])

  // Save-the-date content (text + anchor dahlia + flower field) fades out
  // once the red dahlia has bloomed. The couple heading fades in just
  // after, with a small overlap so the screen is never empty.
  const saveDateOpacity = useTransform(scrollYProgress, [0.4, 0.46], [1, 0])
  const coupleHeadingOpacity = useTransform(scrollYProgress, [0.43, 0.48], [0, 1])
  // Heading fades back out at the very end so the daisy zoom has clean
  // canvas to morph into the next section.
  const coupleHeadingOpacityOut = useTransform(scrollYProgress, [0.93, 1], [1, 0])
  const coupleHeadingOpacityFinal = useTransform(
    [coupleHeadingOpacity, coupleHeadingOpacityOut] as const,
    ([fadeIn, fadeOut]) => Math.min(fadeIn as number, fadeOut as number)
  )

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

  // Cascade math — same shape as the standalone Hero 3 had, just shifted
  // into the [0.5, 0.85] window of the combined progress range.
  const milestones = CONFIG.story?.milestones ?? []
  const N = milestones.length
  const cascadeStart = 0.5
  const cascadeWindow = 0.35
  const perCard = N > 0 ? cascadeWindow / N : cascadeWindow
  const riseSpan = perCard * 1.6

  return (
    <section id="couple" className="relative bg-peach">
      <div ref={stageRef} className="relative h-[700vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* ── Save-the-date layer — fades out at 0.40-0.46 ── */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ opacity: saveDateOpacity }}
          >
            <FloatField
              scrollProgress={scrollYProgress}
              count={30}
              variant="image"
              images={FLOWER_IMAGES}
              sizeMin={70}
              sizeMax={140}
            />

            {/* Persistent dahlia anchor in the bottom-left */}
            <img
              src={DAHLIA_ANCHOR_SRC}
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none absolute bottom-0 left-0 z-[1] h-[55vmin] w-[55vmin] -translate-x-1/4 translate-y-1/4 object-contain"
            />
          </motion.div>

          {/* ── Red dahlia — single persistent element across the whole flow ── */}
          <motion.img
            src={DAHLIA_HERO_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[100vmin] w-[100vmin]"
            style={{
              x: '-50%',
              y: '-50%',
              objectFit: 'contain',
              scale: dahliaScale,
              rotate: dahliaRotate,
              willChange: 'transform',
            }}
          />

          {/* ── Save-the-date text — also fades out at 0.40-0.46 ── */}
          <motion.div
            className="relative z-20 flex h-full flex-col items-center justify-center gap-16 px-6 text-center md:gap-24"
            style={{ opacity: saveDateOpacity }}
          >
            <FlipLetters
              text={'SAVE\nTHE\nDATE'}
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.13}
              staggerRatio={0.95}
              scaleFrom={0.15}
              className="font-display text-forest-deep block text-6xl leading-[1] italic md:text-8xl lg:text-9xl"
              lineClassName="block"
            />

            <div className="flex flex-col items-center gap-6 md:gap-8">
              <FlipLetters
                text={dateLine}
                scrollProgress={scrollYProgress}
                scrollStart={0.13}
                scrollEnd={0.2}
                staggerRatio={0.9}
                scaleFrom={0.2}
                className="font-display text-forest-deep block text-4xl italic md:text-6xl"
              />

              <FlipLetters
                text={countdownText}
                scrollProgress={scrollYProgress}
                scrollStart={0.2}
                scrollEnd={0.27}
                staggerRatio={0.9}
                scaleFrom={0.3}
                className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
              />

              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.24}
                scrollEnd={0.3}
              >
                <p className="font-sans text-forest text-[0.6rem] tracking-[0.4em] uppercase">
                  {t('welcome.countdown.days')} · {t('welcome.countdown.hours')} ·{' '}
                  {t('welcome.countdown.minutes')} · {t('welcome.countdown.seconds')}
                </p>
              </MaskReveal>
            </div>
          </motion.div>

          {/* ── Couple heading — fades in at 0.43-0.48, sits over the dahlia ── */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-16 text-center md:pt-20"
            style={{ opacity: coupleHeadingOpacityFinal }}
          >
            <p className="font-sans text-forest mb-4 text-[0.65rem] tracking-[0.4em] uppercase">
              {t('couple.ourStory')}
            </p>
            <h2 className="font-display text-forest-deep text-3xl italic md:text-5xl">
              {t('couple.title')}
            </h2>
          </motion.div>

          {/* ── Photo cascade — RisingCards in the [0.5, 0.85] window ── */}
          <div className="absolute inset-0 z-10">
            {milestones.map((m, i) => {
              const scrollStart = cascadeStart + i * perCard
              const scrollEnd = scrollStart + riseSpan
              const captionSide: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
              const imageSrc = `${import.meta.env.BASE_URL}photos/${m.photo}`
              const title = lang === 'pt' ? m.title_pt : m.title_en
              const text = lang === 'pt' ? m.text_pt : m.text_en

              return (
                <RisingCard
                  key={`milestone-${i}`}
                  scrollProgress={scrollYProgress}
                  scrollStart={scrollStart}
                  scrollEnd={scrollEnd}
                  imageSrc={imageSrc}
                  imageAlt={title}
                  captionSide={captionSide}
                  photoWidthClass="max-w-md"
                  caption={
                    <div>
                      <div className="font-display text-forest-deep text-5xl leading-none italic md:text-7xl">
                        {m.year}
                      </div>
                      <div className="font-display text-forest-deep mt-3 text-2xl italic md:text-3xl">
                        {title}
                      </div>
                      <div className="font-serif text-forest mt-4 max-w-md text-base leading-relaxed italic md:text-lg">
                        {text}
                      </div>
                    </div>
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
