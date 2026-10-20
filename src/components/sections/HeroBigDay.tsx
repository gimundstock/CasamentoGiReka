import { useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { CerradoPaint } from './CerradoPaint'

/**
 * Linear interpolation between two hex colors. Both must be 7-char `#RRGGBB`.
 */
function lerpHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

const SUN_YELLOW = '#FCCC1D' // dahlia center — also the hand-off color from the previous hero
const SUN_GOLD = '#EF960F' // mid-arc warm gold
const SUN_DEEP = '#DF730F' // setting sun — warm orange (stops short of the deep brick #C85308)

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

// Watercolor sun: a pale center, pigment pooled at the rim, a soft wobbly
// edge and paper grain (the #sun-watercolor filter), so it sits in the
// painting instead of on top of it.
const sunPaint = {
  backgroundImage:
    'radial-gradient(circle at 48% 46%, rgba(255, 244, 200, 0.42) 0%, rgba(255, 236, 170, 0.16) 45%, rgba(255, 236, 170, 0) 66%)',
  boxShadow: 'inset 0 0 1.2vmin 0.5vmin rgba(190, 76, 10, 0.4)',
  filter: 'url(#sun-watercolor)',
} as CSSProperties

/**
 * "The Big Day" hero — picks up the dahlia-center yellow that HeroSaveDateCouple
 * ends on, blooms it out into a setting-sun cerrado scene, and reveals the wedding
 * info on top of the landscape.
 *
 * Choreography (scroll progress 0 → 1, on a 400vh outer / 300vh of locked scroll):
 *   0.00 → 0.10  Hold solid yellow. Buffer beat so the seam with the previous
 *                section is invisible at any scroll speed.
 *   0.10 → 0.30  The yellow flood SHRINKS into a sun disc in the upper-left.
 *                Underneath, the peach background with a golden-hour gradient
 *                fades in. Visually: flood recedes into a sphere.
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

  // Solid yellow flood — visible at the very start, fades out as the sun
  // shrinks. Opacity hold for first 10 % so the seam with the previous
  // section is forgiving of fast scrolls.
  const floodOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return 1
    if (v < 0.3) return 1 - (v - 0.1) / 0.2
    return 0
  })

  // Golden-hour gradient underneath. Fades up as the flood recedes, peaks
  // at sunset, holds through the info panel reveal.
  // const gradientOpacity = useTransform(scrollYProgress, (v: number) => {
  //   if (v < 0.1) return 0
  //   if (v < 0.3) return (v - 0.1) / 0.2
  //   return 1
  // })

  // Sun scale: starts huge (fills viewport, 14x base size) during the flood
  // phase, shrinks to disc size by 0.30, stays at 1 thereafter.
  const sunScale = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return 14
    if (v < 0.3) return 14 - ((v - 0.1) / 0.2) * 13
    return 1
  })

  // Sun position (percent of the artwork box, see sunXAt / sunYAt).
  const sunXPct = useTransform(scrollYProgress, sunXAt)
  const sunYPct = useTransform(scrollYProgress, sunYAt)

  // Sun color: yellow → gold across the rise (0.30 → arc apex ~0.575),
  // then gold → deep sunset orange across the descent (apex → set 0.85).
  const sunColor = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.3) return SUN_YELLOW
    if (v < 0.575) return lerpHex(SUN_YELLOW, SUN_GOLD, (v - 0.3) / 0.275)
    if (v < 0.85) return lerpHex(SUN_GOLD, SUN_DEEP, (v - 0.575) / 0.275)
    return SUN_DEEP
  })

  // Info panel fades in once the sun has set.
  const infoOpacity = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.85) return 0
    if (v < 0.92) return (v - 0.85) / 0.07
    return 1
  })

  // Cerrado landscape SLIDES UP from below the viewport over the same
  // window as the sun shrink (0.10 → 0.30). By the time the art is fully
  // seated at the bottom, the sun has already settled into its disc form.
  // Value is a percentage of the image's own height — '100%' parks it
  // entirely below the bottom edge.
  const cerradoY = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return '100%'
    if (v < 0.3) return `${(1 - (v - 0.1) / 0.2) * 100}%`
    return '0%'
  })

  // Place the sun on screen from its artwork-box percentages (phase 1), or
  // inside the masked artwork box (phase 2).
  const sunLeft = useTransform(sunXPct, artX)
  const sunTop = useTransform(sunYPct, artY)
  const sunLeftPct = useTransform(sunXPct, (x: number) => `${x}%`)
  const sunTopPct = useTransform(sunYPct, (y: number) => `${y}%`)
  // Hand-off between the two sun elements when the sun settles into a disc
  // (0.30): they match exactly there (scale 1, same position and color).
  const sunFloodOpacity = useTransform(scrollYProgress, (v: number) => (v < 0.3 ? 1 : 0))
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
        <div
          id="big-day"
          className="pointer-events-none absolute h-px w-px"
          style={{ top: '285vh' }}
        />
        <div
          className="bg-peach-light sticky top-0 h-screen overflow-hidden [--art-top:44vh] md:[--art-top:14vh]"
          style={artVars}
        >
          {/* ── z-0  Solid yellow flood — meets HeroSaveDateCouple's last
                    frame, then fades out as the sun shrinks. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: SUN_YELLOW, opacity: floodOpacity }}
          />

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

          {/* Watercolor texture for the sun: wobbly edge + paper grain. */}
          <svg aria-hidden className="absolute h-0 w-0">
            <filter id="sun-watercolor" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="soft" />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.03"
                numOctaves="3"
                seed="4"
                result="warp"
              />
              <feDisplacementMap
                in="soft"
                in2="warp"
                scale="9"
                xChannelSelector="R"
                yChannelSelector="G"
                result="shape"
              />
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="2"
                seed="9"
                result="grain"
              />
              <feColorMatrix
                in="grain"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.9 0 0 0 1.3"
                result="grainAlpha"
              />
              {/* Mottling — the pigment settles unevenly, like the sky. */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.07"
                numOctaves="2"
                seed="2"
                result="mottle"
              />
              <feColorMatrix
                in="mottle"
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.1 0 0 0 1.45"
                result="mottleAlpha"
              />
              <feComposite in="shape" in2="grainAlpha" operator="in" result="grained" />
              <feComposite in="grained" in2="mottleAlpha" operator="in" />
            </filter>
          </svg>

          {/* ── z-20  Sun disc, phase 1 — shrinks from a viewport-filling
                    flood into a small disc. Unmasked, because it is bigger
                    than the artwork at this point. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-20 rounded-full"
            style={{
              left: sunLeft,
              top: sunTop,
              width: '14vmin',
              height: '14vmin',
              x: '-50%',
              y: '-50%',
              backgroundColor: sunColor,
              ...sunPaint,
              scale: sunScale,
              opacity: sunFloodOpacity,
              willChange: 'transform',
            }}
          />

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
            <motion.div
              className="absolute rounded-full"
              style={{
                left: sunLeftPct,
                top: sunTopPct,
                width: '14vmin',
                height: '14vmin',
                x: '-50%',
                y: '-50%',
                backgroundColor: sunColor,
                ...sunPaint,
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
