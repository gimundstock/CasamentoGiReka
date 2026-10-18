import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { FallingFlowers } from '../motion/FallingFlowers'
import { FlipLetters } from '../motion/FlipLetters'
import { MaskReveal } from '../motion/MaskReveal'
import { OrbitingStory } from '../motion/OrbitingStory'

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

// Individual wildflowers and loose petals cut from the wildflower pattern,
// transparent background. They fall one by one in FallingFlowers.
const FALLING_BASE = `${import.meta.env.BASE_URL}flowers/falling`
const FALLING_FLOWERS = Array.from(
  { length: 14 },
  (_, i) => `${FALLING_BASE}/flower_${String(i).padStart(2, '0')}.webp`
)
const FALLING_PETALS = Array.from(
  { length: 10 },
  (_, i) => `${FALLING_BASE}/petal_${String(i).padStart(2, '0')}.webp`
)

// The bloom grows from 0 and stops at 80 % of its full size, then spins up
// to the zoom into The Big Day. Its yellow center is what fills the frame
// on the zoom-out.
// Growth is linear over 0.22 → 0.40, so 80 % is reached at 0.22 + 0.8 * 0.18.
const HOLD_SCALE = 0.8
const GROW_END = 0.22 + 0.18 * HOLD_SCALE
const SPIN_END = 0.9
const SPIN_DEG = 1080

// Scroll length. The stage was 800vh of pinned scroll; 45vh of the dead
// stretch between the story heading appearing (progress 0.48) and the
// first photo starting to rise was removed. Every other phase keeps its
// old length in vh. All the 0–1 values below stay on the OLD timeline;
// `scrollYProgress` (see the component) maps the real scroll onto it.
const OLD_SCROLL_VH = 800
const CUT_VH = 45
const SCROLL_VH = OLD_SCROLL_VH - CUT_VH
const HEADING_AT = 0.48
// The first photo used to start rising at 0.62, when the flower had turned
// ~516°. It now starts when the flower has turned 45° less.
const CASCADE_AT = 0.62 - (45 / SPIN_DEG) * (SPIN_END - GROW_END)
// Real-scroll fractions where the shortened stretch begins and ends.
const REAL_GAP_START = (HEADING_AT * OLD_SCROLL_VH) / SCROLL_VH
const REAL_GAP_END =
  REAL_GAP_START + ((CASCADE_AT - HEADING_AT) * OLD_SCROLL_VH - CUT_VH) / SCROLL_VH

const DAISY_HERO_SRC = `${import.meta.env.BASE_URL}flowers/cosmos_hero.webp`

/**
 * Combined Save-the-Date → Meet-the-Couple hero.
 *
 * One pinned section (900vh outer, 100vh sticky inner = 800vh of locked
 * scroll). The long scroll span is deliberate — it gives the daisy grow
 * enough physical scroll distance to actually be perceived, and lets each
 * fade settle before the next layer starts.
 *
 * The daisy is one persistent motion.img across the whole flow — it
 * grows in, holds while the fades and cascade play, then zooms out into
 * the next section.
 *
 * Scroll choreography (progress 0 → 1):
 *   0.00 → 0.48  wildflowers and petals fall one by one (time-based,
 *                pushed further by the scroll)
 *   0.00 → 0.10  "Save the Date" letters scatter-collect
 *   0.10 → 0.15  date line scatter-collects
 *   0.15 → 0.20  countdown digits scatter-collect
 *   0.18 → 0.22  countdown labels mask-reveal
 *   0.22 → 0.364 flower GROWS from the center to 80 % of its full size
 *                (scale 0 → 0.8, -20° → 0° unwind), then stops growing
 *                and starts spinning right away.
 *   0.42 → 0.48  save-the-date layer fades out completely (1 → 0)
 *   0.48 → 0.54  "OUR STORY / The Couple" heading fades in (0 → 1) —
 *                kicks off the moment save-the-date is gone.
 *   0.54 → 0.62  HEADING HOLD — daisy is spinning, heading is fully
 *                present, story title is established BEFORE any photo
 *                begins to rise.
 *   0.62 → 0.90  story milestones orbit the daisy clockwise with it — a 28 % window
 *                (~224vh of scroll) so each milestone has time on screen
 *                for the reader to take in the caption.
 *   0.364 → 0.90 flower spins 0° → 1080° behind the heading + cascade
 *                — keeps the flower visibly alive while the story plays.
 *   0.90 → 1.00  daisy zooms scale 1 → 6 into "The Big Day" — only
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
  const { scrollYProgress: realProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })
  // Old-timeline progress (see OLD_SCROLL_VH): identical to the real scroll
  // up to the story heading and again from the first photo on, with the
  // stretch in between played faster.
  const scrollYProgress = useTransform(realProgress, (s: number) => {
    if (s <= REAL_GAP_START) return (s * SCROLL_VH) / OLD_SCROLL_VH
    if (s <= REAL_GAP_END) {
      const t = (s - REAL_GAP_START) / (REAL_GAP_END - REAL_GAP_START)
      return HEADING_AT + t * (CASCADE_AT - HEADING_AT)
    }
    return CASCADE_AT + ((s - REAL_GAP_END) * SCROLL_VH) / OLD_SCROLL_VH
  })

  // Daisy. Opacity is pinned to 0 from scroll start until the grow
  // begins (0.22), then fades up to 1 in a quick 4 % window, then stays at
  // 1 for the rest of the section. Function-form useTransform — the
  // multi-keyframe array form is unreliable for opacity in this
  // framer-motion 12 setup (verified via headless test).
  const daisyOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.22) return 0
    if (v < 0.26) return (v - 0.22) / 0.04
    return 1
  })
  // Scale grows from 0 to 1 over 0.22–0.40 (an 18 % scroll window — long
  // enough on an 800vh stage to be obviously visible), holds at 1 all the
  // way through the cascade, then zooms HARD from 0.90 → 1.0 (scale 1 → 14)
  // so the daisy's yellow center fully dominates the frame before the
  // hand-off to HeroBigDay.
  const daisyScale = useTransform(
    scrollYProgress,
    [0, 0.22, GROW_END, 0.9, 1],
    [0, 0, HOLD_SCALE, HOLD_SCALE, 18]
  )
  // Rotation: hold at -20° until grow begins and unwind to 0° as it grows.
  // The moment the grow stops (GROW_END) it starts spinning — 1080° (three
  // turns) all the way to the zoom — so it is visibly alive through the
  // save-the-date fade, the heading and the cascade.
  const daisyRotate = useTransform(
    scrollYProgress,
    [0, 0.22, GROW_END, SPIN_END],
    [-20, -20, 0, SPIN_DEG]
  )

  // Save-the-date layer fades out 0.42 → 0.48. Function form for the same
  // reliability reason as the daisy opacity above.
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

  // Daisy-center yellow safety overlay. As the daisy zooms out to scale 6
  // its CENTER (the yellow disc) fills the viewport, but anti-aliased edges
  // and any peach showing through can leave non-yellow pixels. This overlay
  // ramps to opacity 1 over the very last sliver of scroll so HeroBigDay's
  // matching yellow background meets a clean, solid frame at the boundary.
  const yellowMaskOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.96) return 0
    return Math.min(1, (v - 0.96) / 0.04)
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
  // The milestones orbit the flower from the first photo on and must be
  // gone by 0.90, where the daisy zoom-out begins.
  const orbitItems = milestones.map((m) => {
    const title = lang === 'pt' ? m.title_pt : m.title_en
    const text = lang === 'pt' ? m.text_pt : m.text_en
    return {
      imageSrc: `${import.meta.env.BASE_URL}photos/${m.photo}`,
      imageAlt: title,
      caption: (
        <div>
          <div className="font-sans text-3xl leading-none tabular-nums md:text-6xl">{m.year}</div>
          <div className="font-display mt-2 text-xl md:mt-3 md:text-3xl">{title}</div>
          <div className="font-serif mt-2 text-sm leading-snug opacity-90 md:mt-4 md:text-lg md:leading-relaxed">
            {text}
          </div>
        </div>
      ),
    }
  })

  return (
    <section id="couple" className="relative bg-peach">
      <div ref={stageRef} className="relative" style={{ height: `${SCROLL_VH + 100}vh` }}>
        {/* Inner anchor for the Nav "Save the Date" link — placed at scroll
            progress ~0.22 (800vh * 0.22 = 176vh into the stage), the moment
            the SAVE/THE/DATE typography is fully assembled. Empty 1px div
            so scrollIntoView lands the user exactly there. */}
        <div
          id="save-the-date"
          className="pointer-events-none absolute h-px w-px"
          style={{ top: '176vh' }}
        />
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* ── z-0  Save-the-date layer (falling flowers + text)
                    Wrapped as one motion.div so opacity fades the whole
                    group together at 0.40-0.46. ── */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ opacity: saveDateOpacity }}
          >
            <FallingFlowers
              flowers={FALLING_FLOWERS}
              petals={FALLING_PETALS}
              scrollProgress={scrollYProgress}
            />
            <div className="relative flex h-full flex-col items-center justify-center gap-14 px-6 pt-16 text-center md:gap-20">
              <FlipLetters
                text="Save the Date"
                spaceClassNames={['', '-ml-[0.3em]']}
                scrollProgress={scrollYProgress}
                scrollStart={0}
                scrollEnd={0.1}
                staggerRatio={0.95}
                scaleFrom={0.15}
                fadeIn={0.45}
                className="font-display text-title block text-[2.6rem] leading-[1.3] whitespace-nowrap sm:text-6xl md:text-7xl lg:text-8xl"
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
                  fadeIn={0.45}
                  className="font-sans text-title block text-[1.8rem] leading-[1.4] font-light tracking-[0.12em] md:text-5xl md:leading-none"
                />
                <FlipLetters
                  text={countdownText}
                  scrollProgress={scrollYProgress}
                  scrollStart={0.15}
                  scrollEnd={0.2}
                  staggerRatio={0.9}
                  scaleFrom={0.3}
                  fadeIn={0.45}
                  className="font-sans text-title block text-2xl tabular-nums md:text-4xl"
                />
                <MaskReveal
                  direction="up"
                  scrollProgress={scrollYProgress}
                  scrollStart={0.18}
                  scrollEnd={0.22}
                >
                  <p className="font-sans text-title text-[0.6rem] tracking-[0.4em] uppercase">
                    {t('welcome.countdown.days')} · {t('welcome.countdown.hours')} ·{' '}
                    {t('welcome.countdown.minutes')} · {t('welcome.countdown.seconds')}
                  </p>
                </MaskReveal>
              </div>
            </div>
          </motion.div>

          {/* ── z-10  Daisy — single persistent element ── */}
          <motion.img
            src={DAISY_HERO_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[78vmin] w-[78vmin]"
            style={{
              x: '-50%',
              y: '-50%',
              objectFit: 'contain',
              opacity: daisyOpacity,
              scale: daisyScale,
              rotate: daisyRotate,
              willChange: 'transform, opacity',
            }}
          />

          {/* ── z-20  Story milestones orbiting the daisy, clockwise with it ── */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <OrbitingStory
              items={orbitItems}
              scrollProgress={scrollYProgress}
              scrollStart={CASCADE_AT}
              scrollEnd={0.9}
              degPerProgress={SPIN_DEG / (SPIN_END - GROW_END)}
            />
          </div>

          {/* ── z-30  Story heading — plain opacity fade in/out, sits on
                    top of everything once the save-the-date is gone. ── */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-16 text-center md:pt-20"
            style={{ opacity: coupleHeadingOpacity }}
          >
            <h2 className="font-display text-title text-[1.3125rem] lowercase md:text-[1.575rem]">
              {t('couple.ourStory')}
            </h2>
          </motion.div>

          {/* ── z-40  Yellow safety overlay — guarantees a clean solid yellow
                    frame at the very end of this section, matching the
                    starting bg of HeroBigDay so the transition is seamless. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40"
            style={{ backgroundColor: '#FCCC1D', opacity: yellowMaskOpacity }}
          />
        </div>
      </div>
    </section>
  )
}
