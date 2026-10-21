import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { FallingFlowers } from '../motion/FallingFlowers'
import { FlipLetters } from '../motion/FlipLetters'
import { MaskReveal } from '../motion/MaskReveal'
import { OrbitingStory } from '../motion/OrbitingStory'
import {
  SUN_BIG_SCALE,
  SUN_BIG_VMIN,
  SUN_BLUR_HANDOFF,
  SUN_HANDOFF_ROTATE,
  SUN_SIZE,
  SUN_SRC,
} from './sun'

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
// to the end of the section, where it zooms in and its yellow center
// becomes the sun of The Big Day.
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

// The yellow center of cosmos_hero.webp (1200 × 1233): centered across,
// 48.1 % down, about 15 % of the image width. The flower spins and scales
// around it, and it becomes the sun at the end of the section.
const CENTER_Y = 48.1
// In vmin of the 78vmin image box, before scaling: the image is drawn
// 78 × 1200/1233 = 75.9vmin wide; the yellow center, stamen tips
// included, reaches about 7.4 % of that from the middle.
const CENTER_FRINGE_VMIN = 5.6
// Half of the sun's image box on screen at the hand-off. sun2 is not a
// perfect circle: its solid body reaches at least 0.66 of this in every
// direction, its bumps up to ~0.89.
const SUN_HALF_BOX_VMIN = SUN_BIG_VMIN / 2 / 0.833
// The sun sits on the cosmos center throughout, sized so the center,
// stamens included, fits inside the sun's solid body. At the end the flower
// zooms in (0.90 → 0.96) until the sun is SUN_BIG_VMIN across, then the
// petals dissolve into the paper (0.96 → 1.00), and HeroBigDay picks the
// sun up there.
const ZOOM_START = 0.9
const ZOOM_END = 0.96
const ZOOM_SCALE = (SUN_HALF_BOX_VMIN * 0.64) / CENTER_FRINGE_VMIN

function daisyScaleAt(v: number): number {
  if (v < 0.22) return 0
  if (v < GROW_END) return ((v - 0.22) / (GROW_END - 0.22)) * HOLD_SCALE
  if (v < ZOOM_START) return HOLD_SCALE
  // Geometric, so the zoom feels even rather than rushing at the end.
  const t = Math.min(1, (v - ZOOM_START) / (ZOOM_END - ZOOM_START))
  return HOLD_SCALE * Math.pow(ZOOM_SCALE / HOLD_SCALE, t)
}

const DISSOLVE_START = 0.96

/**
 * Combined Save-the-Date → Meet-the-Couple hero.
 *
 * One pinned section (900vh outer, 100vh sticky inner = 800vh of locked
 * scroll). The long scroll span is deliberate — it gives the daisy grow
 * enough physical scroll distance to actually be perceived, and lets each
 * fade settle before the next layer starts.
 *
 * The daisy is one persistent motion.img across the whole flow — it
 * grows in, holds while the fades and the story play, then zooms in and
 * its center becomes the sun of the next section.
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
 *   0.90 → 1.00  the flower zooms in until its center — the sun, all
 *                along — is SUN_BIG_VMIN across, then the petals dissolve
 *                and HeroBigDay picks the sun up there — only
 *                AFTER the last cascade card has scrolled past the top.
 *   0.92 → 1.00  couple heading fades back out so the sun has clean canvas
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
    // At the very end the petals dissolve around the sun (see petalBlur).
    if (v < DISSOLVE_START) return 1
    return Math.max(0, 1 - (v - DISSOLVE_START) / (1 - DISSOLVE_START))
  })
  // ...blurring as they fade, like a wash melting into wet paper rather
  // than a photo fading out. In the image's own (unscaled) pixels.
  const petalBlur = useTransform(scrollYProgress, (v: number) => {
    if (v < DISSOLVE_START) return 'none'
    const t = Math.min(1, (v - DISSOLVE_START) / (1 - DISSOLVE_START))
    return `blur(${(8 * t).toFixed(2)}px)`
  })
  // Scale grows from 0 to 1 over 0.22–0.40 (an 18 % scroll window — long
  // enough on an 800vh stage to be obviously visible), holds at 1 all the
  // way through the story, then zooms to ZOOM_SCALE over 0.90 → 0.97 so the
  // yellow center reaches the sun's size before the
  // hand-off to HeroBigDay.
  const daisyScale = useTransform(scrollYProgress, daisyScaleAt)
  // Rotation: hold at -20° until grow begins and unwind to 0° as it grows.
  // The moment the grow stops (GROW_END) it starts spinning — 1080° (three
  // turns) all the way to the end — so it is visibly alive through the
  // save-the-date fade, the heading and the cascade.
  const daisyRotate = useTransform(
    scrollYProgress,
    [0, 0.22, GROW_END, SPIN_END, 1],
    [-20, -20, 0, SPIN_DEG, SUN_HANDOFF_ROTATE]
  )

  // The sun IS the cosmos center, all the way through: it sits on the
  // flower's center, spinning and zooming with it, sized to cover it. At
  // the end only the petals dissolve, and the sun is already there.
  const sunScale = useTransform(daisyScale, (sc: number) => (sc * SUN_BIG_SCALE) / ZOOM_SCALE)
  // It starts softening into watercolor while the petals dissolve around it.
  const sunBlur = useTransform(scrollYProgress, (v: number) => {
    const t = Math.min(1, Math.max(0, (v - DISSOLVE_START) / (1 - DISSOLVE_START)))
    return `blur(${(SUN_BLUR_HANDOFF * t).toFixed(2)}px)`
  })
  // Once this section unpins and starts scrolling away, HeroBigDay's sun
  // (fixed on screen through the seam) has taken over — hide this one so
  // the sun is never seen twice.
  const { scrollYProgress: pastProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end start'],
  })
  const unpinAt = SCROLL_VH / (SCROLL_VH + 100)
  const sunOpacity = useTransform([scrollYProgress, pastProgress], ([v, past]: number[]) => {
    // A few pixels of overlap past the unpin, where both suns are identical
    // and still (HeroBigDay holds its rotation there), so the hand-off has
    // no gap and no jump.
    if (past > unpinAt + 0.003 || v < 0.22) return 0
    if (v < 0.26) return (v - 0.22) / 0.04
    return 1
  })

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

  // The page warms to HeroBigDay's paper color as the sun forms, so the two
  // sections meet on the same background.
  const paperOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.92) return 0
    return Math.min(1, (v - 0.92) / 0.08)
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
  // gone by 0.90, where the zoom begins.
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

          {/* ── z-[5]  Paper — warms to HeroBigDay's background at the end. ── */}
          <motion.div
            aria-hidden
            className="bg-peach-light pointer-events-none absolute inset-0 z-[5]"
            style={{ opacity: paperOpacity }}
          />

          {/* ── z-10  Daisy — single persistent element ── */}
          <motion.img
            src={DAISY_HERO_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 h-[78vmin] w-[78vmin]"
            style={{
              x: '-50%',
              y: `-${CENTER_Y}%`,
              transformOrigin: `50% ${CENTER_Y}%`,
              filter: petalBlur,
              objectFit: 'contain',
              opacity: daisyOpacity,
              scale: daisyScale,
              rotate: daisyRotate,
              willChange: 'transform, opacity',
            }}
          />

          {/* ── z-[11]  The sun — the cosmos's center from the start,
                    (fixed, not absolute: when this section unpins, the
                    browser scrolls it a frame before the hand-off runs, and
                    the sun would bump up with it)
                    spinning and zooming with the flower. Ends with the same
                    size, place and rotation as where HeroBigDay starts. ── */}
          <motion.img
            src={SUN_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none fixed top-1/2 left-1/2 z-[11] max-w-none select-none"
            style={{
              width: SUN_SIZE,
              height: SUN_SIZE,
              x: '-50%',
              y: '-50%',
              scale: sunScale,
              rotate: daisyRotate,
              filter: sunBlur,
              opacity: sunOpacity,
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
        </div>
      </div>
    </section>
  )
}
