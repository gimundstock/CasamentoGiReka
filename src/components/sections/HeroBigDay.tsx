import { useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { CerradoPaint } from './CerradoPaint'
import { SUN_BIG_SCALE, SUN_HANDOFF_ROTATE, SUN_SIZE, SUN_SRC } from './sun'

// The cerrado artwork: a watercolor painting (public/cerrado/paint.webp)
// painted in around the sun as it travels, the pencil line
// art registered onto it (lines.webp), and a sky mask (sky-mask.webp) that
// keeps the sun from showing over the hills. All are 1376 × 768.
const ART_ASPECT = 1376 / 768
const ART = `${import.meta.env.BASE_URL}cerrado`

// Artwork box, full-bleed: at least as wide as the viewport and tall enough
// to reach the bottom edge, hanging from --art-top (set on the stage; lower
// on phones to leave room for the info panel). When it is wider than the
// screen (phones) the big tree is kept in view. Sun and heading positions
// are fractions of this box.
const artVars = {
  '--art-w': `max(100vw, calc((100vh - var(--art-top)) * ${ART_ASPECT.toFixed(4)}))`,
  '--art-h': `calc(var(--art-w) / ${ART_ASPECT.toFixed(4)})`,
  '--art-left': 'clamp(calc(100vw - var(--art-w)), calc(50vw - var(--art-w) * 0.3), 0px)',
} as CSSProperties
const artBox = {
  left: 'var(--art-left)',
  top: 'var(--art-top)',
  width: 'var(--art-w)',
  height: 'var(--art-h)',
} as CSSProperties

/** `calc()` that places an x/y percentage (0–100) of the artwork box on screen. */
const artX = (pct: number) => `calc(var(--art-left) + var(--art-w) * ${pct / 100})`
const artY = (pct: number) => `calc(var(--art-top) + var(--art-h) * ${pct / 100})`

// Sun position in artwork-box percentages: phase 1 (0.00–0.10) centered
// while it floods, phase 2 (0.10–0.30) drifts to the upper-left as it
// shrinks, phases 3+4 (0.30–0.85) a single arc — up to an apex, then down
// to set behind the hills — and it stays there afterwards.
// Where the sun ends up: the point of light on the horizon in the painting,
// where the rays converge (56 % across, 51.3 % down).
const SUN_SET_X = 56
const SUN_SET_Y = 51.3

function sunXAt(v: number): number {
  if (v < 0.1) return 50
  if (v < 0.3) return 50 - ((v - 0.1) / 0.2) * 42
  if (v < 0.85) return 8 + ((v - 0.3) / 0.55) * (SUN_SET_X - 8)
  return SUN_SET_X
}

function sunYAt(v: number): number {
  if (v < 0.1) return 50
  if (v < 0.3) return 50 - ((v - 0.1) / 0.2) * 26
  if (v < 0.85) {
    const tt = (v - 0.3) / 0.55
    // Linear baseline 24 → SUN_SET_Y with a parabolic bulge UP, so the sun
    // passes above the left tree crown and then comes down to the light.
    return 24 + tt * (SUN_SET_Y - 24) - 24 * 4 * tt * (1 - tt)
  }
  return SUN_SET_Y
}

// The watercolor is painted in around the sun as it travels (see
// CerradoPaint): from when the sun settles into a disc (0.28) until the
// whole painting is colored (0.82).
const PAINT_START = 0.28
const PAINT_END = 0.82

/**
 * "The Big Day" hero — the cosmos center from HeroSaveDateCouple arrives as
 * the sun, rises and travels a setting-sun arc over a watercolor cerrado
 * that is painted in around it, then reveals the wedding info.
 *
 * Choreography (scroll progress 0 → 1, on a 400vh outer / 300vh of locked scroll):
 *   (seam)       The sun arrives from the previous section in the middle of
 *                the screen and starts rising while the sections pass.
 *   0.00 → 0.30  The landscape slides up while the sun rises and shrinks to
 *                the upper-left.
 *   0.30 → 0.70  Sun arcs from upper-left → upper-right along a parabola.
 *                Color warms from yellow → orange-gold. End point: roughly
 *                where the palm tree used to stand in the cerrado.
 *   0.70 → 0.85  Sun "sets" behind the cerrado silhouette — descends below
 *                the horizon, color deepens to a sunset orange.
 *   0.85 → 1.00  Wedding-info panel fades in above the landscape.
 *
 * The landscape is two aligned layers cut from one watercolor painting
 * (public/cerrado/): the ground + line art, opaque so the sun sets behind
 * it, and the watercolor sky. The color spreads out from the sun and stays
 * along its arc, widening as it goes (CerradoPaint).
 *
 * All opacity / color motion values use the FUNCTION form of useTransform
 * (`useTransform(scroll, v => ...)`) — the multi-keyframe array form has a
 * subscription bug for opacity in framer-motion 12 here.
 */
export function HeroBigDay() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  // Sun, phase 1: it arrives from HeroSaveDateCouple as the zoomed-in
  // cosmos center — big, in the middle of the screen. It is FIXED on
  // screen from the moment that section unpins, through the 100vh where
  // the two sections scroll past each other, so it never moves with the
  // page or shows twice. `seam` runs from that moment (this stage's top
  // at the viewport bottom) to the end; `ext` is the same scroll on this
  // section's own 0 → 1 timeline, so it is -1/3 at the hand-off.
  const { scrollYProgress: seam } = useScroll({
    target: stageRef,
    offset: ['start end', 'end end'],
  })
  const ext = useTransform(seam, (p: number) => (p * 4 - 1) / 3)
  // Starts rising while the two sections are still passing each other
  // (-0.15), and reaches the upper-left of the painting at its disc size
  // as the landscape settles (0.30).
  const riseT = (v: number) => Math.min(1, Math.max(0, (v + 0.15) / 0.45))
  const sunRiseLeft = useTransform(ext, (v: number) => {
    const t = riseT(v)
    return `calc(50% * ${1 - t} + ${artX(sunXAt(0.3))} * ${t})`
  })
  const sunRiseTop = useTransform(ext, (v: number) => {
    const t = riseT(v)
    return `calc(50% * ${1 - t} + ${artY(sunYAt(0.3))} * ${t})`
  })
  const sunRiseScale = useTransform(ext, (v: number) => Math.pow(SUN_BIG_SCALE, 1 - riseT(v)))
  const sunRiseOpacity = useTransform([seam, ext], ([p, v]: number[]) => (p > 0 && v < 0.3 ? 1 : 0))
  const sunRiseRotate = useTransform(ext, (v: number) => SUN_HANDOFF_ROTATE + (v + 1 / 3) * 240)

  // Sun position (percent of the artwork box, see sunXAt / sunYAt).
  const sunXPct = useTransform(scrollYProgress, sunXAt)
  const sunYPct = useTransform(scrollYProgress, sunYAt)

  // The sun warms as it travels: golden on the rise, deeper orange as it
  // sets (0.30 → 0.85). It keeps turning slowly, carried on from the
  // flower's spin.
  const sunFilter = useTransform(scrollYProgress, (v: number) => {
    const t = Math.min(1, Math.max(0, (v - 0.3) / 0.55))
    return `hue-rotate(${(-16 * t).toFixed(1)}deg) saturate(${(1 + 0.35 * t).toFixed(2)}) brightness(${(1 - 0.12 * t).toFixed(3)})`
  })
  const sunRotate = useTransform(
    scrollYProgress,
    (v: number) => SUN_HANDOFF_ROTATE + (v + 1 / 3) * 240
  )

  // Info panel fades in once the sun has set.
  const infoOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.85) return 0
    if (v < 0.92) return (v - 0.85) / 0.07
    return 1
  })

  // Cerrado landscape SLIDES UP from below the viewport over the same
  // window as the sun shrink (0.00 → 0.30). By the time the art is fully
  // seated at the bottom, the sun has already settled into its disc form.
  // Value is a percentage of the image's own height — '100%' parks it
  // entirely below the bottom edge.
  const cerradoY = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.3) return `${(1 - v / 0.3) * 100}%`
    return '0%'
  })

  // Sun, phase 2: position inside the masked artwork box.
  const sunLeftPct = useTransform(sunXPct, (x: number) => `${x}%`)
  const sunTopPct = useTransform(sunYPct, (y: number) => `${y}%`)
  // Hand-off between the two sun elements at 0.30, where they match
  // exactly (same position, size, rotation and tint).
  const sunArcOpacity = useTransform(scrollYProgress, (v: number) => (v < 0.3 ? 0 : 1))

  const weddingDate = new Date(CONFIG.wedding.date)
  const dateStr = weddingDate.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const dressCode = lang === 'pt' ? CONFIG.wedding.dresscode_pt : CONFIG.wedding.dresscode_en
  // Split "Category — details" so the descriptor wraps to its own line.
  const [dressCodeHead, ...dressCodeRest] = dressCode.split(' — ')
  const dressCodeTail = dressCodeRest.join(' — ')

  // Split "street, city, state" so the geo segment wraps to its own line.
  const addressParts = CONFIG.wedding.address.split(',').map((s) => s.trim())
  const addressHead = addressParts[0]
  const addressTail = addressParts.slice(1).join(', ')

  return (
    <section id="wedding" className="relative">
      <div ref={stageRef} className="relative h-[400vh]">
        {/* Inner anchor for the Nav "The Wedding" link — placed at scroll
            progress ~0.95 (300vh * 0.95 = 285vh into the stage), the
            moment the info panel + sun-set landscape are fully shown. */}
        {/* ── z-20  Sun, phase 1 — fixed on screen (see `seam`): the zoomed
                  cosmos center, rising from the middle of the screen to the
                  upper-left as it shrinks. Unmasked: it starts outside the
                  sky. Sets the same art variables as the stage so its end
                  point lands on the painting. ── */}
        <motion.img
          src={SUN_SRC}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none fixed z-20 max-w-none select-none [--art-top:44vh] md:[--art-top:14vh]"
          style={{
            ...artVars,
            left: sunRiseLeft,
            top: sunRiseTop,
            width: SUN_SIZE,
            height: SUN_SIZE,
            x: '-50%',
            y: '-50%',
            scale: sunRiseScale,
            rotate: sunRiseRotate,
            filter: sunFilter,
            opacity: sunRiseOpacity,
            willChange: 'transform',
          }}
        />
        <div
          id="big-day"
          className="pointer-events-none absolute h-px w-px"
          style={{ top: '285vh' }}
        />
        <div
          className="bg-peach-light sticky top-0 h-screen overflow-hidden [--art-top:44vh] md:[--art-top:14vh]"
          style={artVars}
        >
          {/* ── z-10  Watercolor painting (sky and ground) — painted in
                    around the sun as it travels, so the color follows its
                    arc. Slides up with the line art. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-10 overflow-hidden"
            style={{ ...artBox, y: cerradoY }}
          >
            <CerradoPaint
              src={`${ART}/paint.webp`}
              aspect={ART_ASPECT}
              progress={scrollYProgress}
              sunX={sunXAt}
              sunY={sunYAt}
              start={PAINT_START}
              end={PAINT_END}
            />
          </motion.div>

          {/* ── z-20  Sun disc, phase 2 — arcs across the sky and sets. It
                    lives inside a box masked to the sky, so it disappears
                    behind the hills instead of showing over the painted
                    ground. The mask is static; only the sun moves. ── */}
          <div
            aria-hidden
            className="pointer-events-none absolute z-20"
            style={{
              ...artBox,
              maskImage: `url(${ART}/sky-mask.webp)`,
              WebkitMaskImage: `url(${ART}/sky-mask.webp)`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
            }}
          >
            {/* Golden haze around the sun, so it glows into the painted light. */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: sunLeftPct,
                top: sunTopPct,
                width: '46vmin',
                height: '46vmin',
                x: '-50%',
                y: '-50%',
                background:
                  'radial-gradient(circle, rgba(255, 226, 140, 0.45) 0%, rgba(255, 214, 120, 0.18) 35%, rgba(255, 214, 120, 0) 68%)',
                opacity: sunArcOpacity,
              }}
            />
            <motion.img
              src={SUN_SRC}
              alt=""
              draggable={false}
              className="absolute max-w-none select-none"
              style={{
                left: sunLeftPct,
                top: sunTopPct,
                width: SUN_SIZE,
                height: SUN_SIZE,
                x: '-50%',
                y: '-50%',
                rotate: sunRotate,
                filter: sunFilter,
                opacity: sunArcOpacity,
                willChange: 'transform',
              }}
            />
          </div>

          {/* ── z-30  Pencil line art, registered onto the painting. SLIDES
                    UP from below the viewport alongside the sun shrink so
                    the drawing rises into place. ── */}
          <motion.img
            src={`${ART}/lines.webp`}
            alt=""
            aria-hidden
            draggable={false}
            style={{ ...artBox, y: cerradoY }}
            className="pointer-events-none absolute z-30 max-w-none select-none"
          />

          {/* ── z-30  Soft paper fade behind the info strip so the text stays
                    readable over the top of the painted sky. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-30"
            style={{
              opacity: infoOpacity,
              height: 'calc(var(--art-top) + var(--art-h) * 0.28)',
              background:
                'linear-gradient(to bottom, rgba(255, 244, 232, 0.92) 0%, rgba(255, 244, 232, 0.8) 45%, rgba(255, 244, 232, 0) 100%)',
            }}
          />

          {/* ── z-40  Horizontal top strip — five-column metadata row
                    (date · time · venue · dress · address), vertically
                    centered in the region between the nav bar and the
                    top of the cerrado silhouette. ── */}
          <motion.div
            className="absolute inset-x-0 z-40 flex items-center px-8 md:px-12"
            style={{
              opacity: infoOpacity,
              top: '8vh',
              // Down to just above the tree crowns.
              bottom: 'calc(100% - var(--art-top) - var(--art-h) * 0.17)',
            }}
          >
            <dl className="text-title mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-x-8 gap-y-6 text-center md:grid-cols-4 md:gap-x-10">
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.date')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-lg leading-tight md:text-2xl">
                  {dateStr}
                  <br />
                  {CONFIG.wedding.time}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.venue')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-lg leading-tight md:text-2xl">
                  {CONFIG.wedding.venue}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.address')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-lg leading-tight md:text-2xl">
                  {addressHead}
                  {addressTail && (
                    <>
                      <br />
                      {addressTail}
                    </>
                  )}
                </dd>
                <a
                  href={CONFIG.wedding.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-title border-forest-deep/50 hover:border-forest-deep font-sans mt-3 inline-block border-b pb-0.5 text-[0.6rem] tracking-[0.3em] uppercase transition-colors"
                >
                  {t('wedding.directions')}
                </a>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.dresscode')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-lg leading-tight md:text-2xl">
                  {dressCodeHead}
                  {dressCodeTail && (
                    <>
                      <br />
                      {dressCodeTail}
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </motion.div>

          {/* ── z-40  Page title + tagline — sit ABOVE the setting sun so
                    the headline reads as part of the landscape composition.
                    Block is anchored at its BOTTOM (y: -100%) on the line
                    just above the sun, with the tagline first and the
                    title closest to the sun. ── */}
          <motion.div
            className="absolute z-40 w-[min(18rem,80vw)] text-center"
            style={{
              opacity: infoOpacity,
              // Keep the block inside the screen on narrow viewports.
              left: `clamp(9rem, ${artX(78)}, calc(100% - 9rem))`,
              top: artY(25),
              x: '-50%',
              y: '-100%',
            }}
          >
            <p className="font-sans text-title mb-3 text-[0.65rem] tracking-[0.4em] uppercase md:mb-4">
              {t('wedding.tagline')}
            </p>
            <h2 className="font-display text-title text-2xl whitespace-nowrap md:text-3xl">
              {t('wedding.title')}
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
