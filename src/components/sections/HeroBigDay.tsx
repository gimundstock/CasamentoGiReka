import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'

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

  // Sun position (percent of viewport).
  //   phase 1 (0.00-0.10): centered (50, 50) while it's flooding
  //   phase 2 (0.10-0.30): drifts to upper-left (20, 22) as it shrinks
  //   phase 3+4 (0.30-0.85): SINGLE continuous arc — rises from (20, 22),
  //     peaks at the midpoint (49, 10 — higher than the start), then
  //     descends on the right and sets at (78, 78), where the palm tree
  //     used to be. The x progresses linearly while y follows a parabola
  //     that bulges UP (lower y = higher on screen).
  //   phase 5+ (0.85-1.00): sun stays anchored at the set position.
  const sunXPct = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return 50
    if (v < 0.3) return 50 - ((v - 0.1) / 0.2) * 30
    if (v < 0.85) return 20 + ((v - 0.3) / 0.55) * 58
    return 78
  })

  const sunYPct = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return 50
    if (v < 0.3) return 50 - ((v - 0.1) / 0.2) * 28
    if (v < 0.85) {
      const tt = (v - 0.3) / 0.55
      // Linear baseline 22 → 68, with a parabolic bulge UP so the apex
      // (at tt=0.5) lands at y = (22+68)/2 - 35 = 10 — clearly higher on
      // screen than the start.
      return 22 + tt * 46 - 35 * 4 * tt * (1 - tt)
    }
    return 68
  })

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
  // entirely below the bottom edge. The settled position is '20%' so the
  // bottom 20 % of the SVG's natural margin is pushed off-screen.
  const cerradoY = useTransform(scrollYProgress, (v: number) => {
    if (v < 0.1) return '100%'
    if (v < 0.3) return `${(1 - (v - 0.1) / 0.2) * 80 + 20}%`
    return '20%'
  })

  // Compose `${n}%` strings for CSS positioning.
  const sunLeft = useTransform(sunXPct, (x: number) => `${x}%`)
  const sunTop = useTransform(sunYPct, (y: number) => `${y}%`)

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
    <section id="big-day" className="relative">
      <div ref={stageRef} className="relative h-[400vh]">
        <div className="bg-peach-light sticky top-0 h-screen overflow-hidden">
          {/* ── z-0  Solid yellow flood — meets HeroSaveDateCouple's last
                    frame, then fades out as the sun shrinks. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: SUN_YELLOW, opacity: floodOpacity }}
          />

          {/* ── z-10  Golden-hour gradient — sky → warm gold → horizon. ── */}
          {/* <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(to bottom, #FFF4E8 0%, #FFE8C8 45%, #F6B013 78%, #C85308 100%)',
              opacity: gradientOpacity,
            }}
          /> */}

          {/* ── z-20  Sun disc — shrinks from a viewport-filling flood into
                    a small disc, then arcs across the sky and sets. ── */}
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
              scale: sunScale,
              boxShadow: '0 0 80px 20px rgba(252, 204, 29, 0.35)',
              willChange: 'transform, background-color',
            }}
          />

          {/* ── z-30  Cerrado landscape — pinned to the bottom, full width.
                    SLIDES UP from below the viewport alongside the sun
                    shrink so the line drawing rises into place rather than
                    sitting on top of a yellow flood. The sun dips behind
                    it during the setting phase. ── */}
          <motion.img
            src={`${import.meta.env.BASE_URL}cerrado.svg`}
            alt=""
            aria-hidden
            draggable={false}
            style={{ y: cerradoY }}
            className="pointer-events-none absolute bottom-0 left-[-5%] z-30 w-[110%] max-w-none select-none"
          />

          {/* ── z-40  Horizontal top strip — five-column metadata row
                    (date · time · venue · dress · address), vertically
                    centered in the region between the nav bar and the
                    top of the cerrado silhouette. ── */}
          <motion.div
            className="absolute inset-x-0 z-40 flex items-center px-8 md:px-12"
            style={{ opacity: infoOpacity, top: '2vh', bottom: '56vh' }}
          >
            <dl className="text-forest-deep mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-x-8 gap-y-6 text-center md:grid-cols-4 md:gap-x-10">
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.date')}
                </dt>
                <dd className="font-display mt-2 text-lg leading-tight md:text-2xl">
                  {dateStr}
                  <br />
                  {CONFIG.wedding.time}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.venue')}
                </dt>
                <dd className="font-display mt-2 text-lg leading-tight md:text-2xl">
                  {CONFIG.wedding.venue}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.address')}
                </dt>
                <dd className="font-display mt-2 text-lg leading-tight md:text-2xl">
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
                  className="text-forest-deep border-forest-deep/50 hover:border-forest-deep font-sans mt-3 inline-block border-b pb-0.5 text-[0.6rem] tracking-[0.3em] uppercase transition-colors"
                >
                  {t('wedding.directions')}
                </a>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.dresscode')}
                </dt>
                <dd className="font-display mt-2 text-lg leading-tight md:text-2xl">
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
            className="absolute z-40 text-center"
            style={{
              opacity: infoOpacity,
              left: '78%',
              top: '67%',
              x: '-50%',
              y: '-100%',
            }}
          >
            <p className="font-sans text-forest mb-3 text-[0.65rem] tracking-[0.4em] uppercase md:mb-4">
              {t('wedding.tagline')}
            </p>
            <h2 className="font-display text-forest-deep text-3xl whitespace-nowrap italic md:text-5xl lg:text-6xl">
              {t('wedding.title')}
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
