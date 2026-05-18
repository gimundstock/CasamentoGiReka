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
 * One pinned section (900vh outer, 100vh sticky inner = 800vh of locked
 * scroll). The long scroll span is deliberate — it gives the dahlia grow
 * enough physical scroll distance to actually be perceived, and lets each
 * fade settle before the next layer starts.
 *
 * The red dahlia is one persistent motion.img across the whole flow — it
 * grows in, holds while the fades and cascade play, then zooms out into
 * the next section.
 *
 * Scroll choreography (progress 0 → 1):
 *   0.00 → 0.10  SAVE / THE / DATE letters scatter-collect
 *   0.10 → 0.15  date line scatter-collects
 *   0.15 → 0.20  countdown digits scatter-collect
 *   0.18 → 0.22  countdown labels mask-reveal
 *   0.22 → 0.40  red dahlia GROWS from the center (scale 0 → 1, -20° → 0°
 *                unwind) — a long 18 % scroll window (~144vh of scrolling)
 *                so the grow is unmistakable.
 *   0.42 → 0.48  save-the-date layer fades out completely (1 → 0)
 *   0.48 → 0.54  "OUR STORY / The Couple" heading fades in (0 → 1) —
 *                kicks off the moment save-the-date is gone.
 *   0.54 → 0.62  HEADING HOLD — dahlia is spinning, heading is fully
 *                present, story title is established BEFORE any photo
 *                begins to rise.
 *   0.62 → 0.90  photo cascade rises past the dahlia — a 28 % window
 *                (~224vh of scroll) so each milestone has time on screen
 *                for the reader to take in the caption.
 *   0.54 → 0.90  red dahlia spins 0° → 720° behind the heading + cascade
 *                — keeps the flower visibly alive while the story plays.
 *   0.90 → 1.00  red dahlia zooms scale 1 → 6 into "The Big Day" — only
 *                AFTER the last cascade card has scrolled past the top.
 *   0.92 → 1.00  couple heading fades back out so the zoom has clean canvas
 *
 * All opacity motion values use explicit 4-keyframe ramps that pin to 0
 * (or 1) at both ends of the scroll range — this prevents any layer from
 * extrapolating back into view past its window.
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

  // Red dahlia. Opacity is pinned to 0 from scroll start until the grow
  // begins (0.22), then fades up to 1 in a quick 4 % window, then stays at
  // 1 for the rest of the section. Function-form useTransform — the
  // multi-keyframe array form is unreliable for opacity in this
  // framer-motion 12 setup (verified via headless test).
  const dahliaOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.22) return 0
    if (v < 0.26) return (v - 0.22) / 0.04
    return 1
  })
  // Scale grows from 0 to 1 over 0.22–0.40 (an 18 % scroll window — long
  // enough on an 800vh stage to be obviously visible), holds at 1 all the
  // way through the cascade, and only zooms out to 6 in the final 0.90–1.0
  // window AFTER the last story card has passed.
  const dahliaScale = useTransform(scrollYProgress, [0, 0.22, 0.4, 0.9, 1], [0, 0, 1, 1, 6])
  // Rotation: hold at -20° until grow begins, unwind to 0° as it grows,
  // hold at 0° during the save-date fade-out, then spin a full 720° (two
  // turns) starting the moment the couple heading appears so the dahlia
  // is visibly alive while the heading sits and the cascade plays.
  const dahliaRotate = useTransform(
    scrollYProgress,
    [0, 0.22, 0.4, 0.54, 0.9],
    [-20, -20, 0, 0, 720]
  )

  // Save-the-date layer fades out 0.42 → 0.48. Function form for the same
  // reliability reason as the dahlia opacity above.
  const saveDateOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.42) return 1
    if (v < 0.48) return 1 - (v - 0.42) / 0.06
    return 0
  })

  // Couple heading: invisible through save-date, fades in 0.48 → 0.54,
  // stays at 1 throughout the cascade, fades back out 0.92 → 1.0.
  const coupleHeadingOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.48) return 0
    if (v < 0.54) return (v - 0.48) / 0.06
    if (v < 0.92) return 1
    if (v < 1) return 1 - (v - 0.92) / 0.08
    return 0
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

  const milestones = CONFIG.story?.milestones ?? []
  const N = milestones.length
  // Cascade runs over a long window so each milestone is on screen long
  // enough to be read, and finishes precisely at 0.90 (the scroll point
  // where the dahlia zoom-out begins). perCard is solved so the LAST card
  // ends at cascadeEnd: start + (N-1)*perCard + perCard*(1+overlap) =
  // cascadeEnd  →  perCard = (cascadeEnd - cascadeStart) / (N + overlap).
  const cascadeStart = 0.62
  const cascadeEnd = 0.9
  const cascadeOverlap = 0.6
  const perCard = N > 0 ? (cascadeEnd - cascadeStart) / (N + cascadeOverlap) : 0.1
  const riseSpan = perCard * (1 + cascadeOverlap)

  return (
    <section id="couple" className="relative bg-peach">
      <div ref={stageRef} className="relative h-[900vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* ── z-0  Save-the-date layer (FloatField + anchor + text)
                    Wrapped as one motion.div so opacity fades the whole
                    group together at 0.40-0.46. ── */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ opacity: saveDateOpacity }}
          >
            <FloatField
              scrollProgress={scrollYProgress}
              count={30}
              variant="image"
              images={FLOWER_IMAGES}
              sizeMin={70}
              sizeMax={140}
              prefill={0.4}
            />
            <img
              src={DAHLIA_ANCHOR_SRC}
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none absolute bottom-0 left-0 h-[55vmin] w-[55vmin] -translate-x-1/4 translate-y-1/4 object-contain"
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-16 px-6 text-center md:gap-24">
              <FlipLetters
                text={'SAVE\nTHE\nDATE'}
                scrollProgress={scrollYProgress}
                scrollStart={0}
                scrollEnd={0.1}
                staggerRatio={0.95}
                scaleFrom={0.15}
                className="font-display text-forest-deep block text-6xl leading-[1] italic md:text-8xl lg:text-9xl"
                lineClassName="block"
              />
              <div className="flex flex-col items-center gap-6 md:gap-8">
                <FlipLetters
                  text={dateLine}
                  scrollProgress={scrollYProgress}
                  scrollStart={0.1}
                  scrollEnd={0.15}
                  staggerRatio={0.9}
                  scaleFrom={0.2}
                  className="font-display text-forest-deep block text-4xl italic md:text-6xl"
                />
                <FlipLetters
                  text={countdownText}
                  scrollProgress={scrollYProgress}
                  scrollStart={0.15}
                  scrollEnd={0.2}
                  staggerRatio={0.9}
                  scaleFrom={0.3}
                  className="font-display text-forest-deep block text-2xl tabular-nums italic md:text-4xl"
                />
                <MaskReveal
                  direction="up"
                  scrollProgress={scrollYProgress}
                  scrollStart={0.18}
                  scrollEnd={0.22}
                >
                  <p className="font-sans text-forest text-[0.6rem] tracking-[0.4em] uppercase">
                    {t('welcome.countdown.days')} · {t('welcome.countdown.hours')} ·{' '}
                    {t('welcome.countdown.minutes')} · {t('welcome.countdown.seconds')}
                  </p>
                </MaskReveal>
              </div>
            </div>
          </motion.div>

          {/* ── z-10  Red dahlia — single persistent element ── */}
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
              opacity: dahliaOpacity,
              scale: dahliaScale,
              rotate: dahliaRotate,
              willChange: 'transform, opacity',
            }}
          />

          {/* ── z-20  Photo cascade — RisingCards rising past the dahlia ── */}
          <div className="pointer-events-none absolute inset-0 z-20">
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

          {/* ── z-30  Couple heading — plain opacity fade in/out, sits on
                    top of everything once the save-the-date is gone. ── */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-16 text-center md:pt-20"
            style={{ opacity: coupleHeadingOpacity }}
          >
            <p className="font-sans text-forest mb-4 text-[0.65rem] tracking-[0.4em] uppercase">
              {t('couple.ourStory')}
            </p>
            <h2 className="font-display text-forest-deep text-3xl italic md:text-5xl">
              {t('couple.title')}
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
