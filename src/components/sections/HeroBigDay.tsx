import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { useReducedMotion } from '../motion/useReducedMotion'
import { CerradoPaint } from './CerradoPaint'
import { BrasiliaPassport } from './passport/BrasiliaPassport'
import {
  BIG_DAY_VH,
  isDesk,
  passportAnchorVh,
  passportVh,
  PHASE,
  passportGeometry,
  seg,
  swapOpacities,
  type PassportGeometry,
} from './passport/geometry'
import { SUN_BIG_SCALE, SUN_BLUR_FINAL, SUN_HANDOFF_ROTATE, SUN_SIZE, SUN_SRC } from './sun'

// The cerrado artwork: a watercolor painting (public/cerrado/paint.webp)
// painted in around the sun as it travels, the pencil line
// art registered onto it (lines.webp), and a sky mask (sky-mask.webp) that
// keeps the sun from showing over the hills. All share the 1376 × 768 aspect
// (lines.webp is the hand-drawn vector art-src/cerrado/lines.svg rendered at
// 3200px wide: Safari re-rasterised the 4MB SVG as it moved and stuttered).
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

// The stage scrolls (is pinned) for the big day, then for the passport
// (longer on a wide screen, where it shares a desk with the invitation).
const lockedVh = (desk: boolean) => BIG_DAY_VH + passportVh(desk)
const deskNow = () => isDesk(window.innerWidth, window.innerHeight)
// Nav highlight: "The Wedding" until the passport starts taking shape, then
// "Brasília". The band the Nav watches sits 30–45 % down the screen.
const CITY_MARK_VH = BIG_DAY_VH + PHASE.infoOut[1] + 30

/** Viewport size as the stage sees it (vw as CSS's 100vw, vh as its height). */
function useStageGeometry(ref: RefObject<HTMLDivElement | null>) {
  const [g, setG] = useState<PassportGeometry | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setG((prev) => {
        const vw = window.innerWidth
        const vh = el.clientHeight
        return prev && prev.vw === vw && prev.vh === vh
          ? prev
          : passportGeometry(vw, vh, window.innerHeight)
      })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])
  return g
}

/**
 * "The Big Day" hero — the cosmos center from HeroSaveDateCouple arrives as
 * the sun, rises and travels a setting-sun arc over a watercolor cerrado
 * that is painted in around it, then reveals the wedding info — and then
 * becomes the city guide: the finished painting shrinks into a watercolor
 * blot on the cover of a passport, which opens (passport/BrasiliaPassport).
 *
 * The stage is pinned for BIG_DAY_VH + passportVh() of scroll. The big day
 * keeps its original 0 → 1 over the first BIG_DAY_VH (300vh, as before);
 * the passport's phases follow (passport/geometry.ts, PHASE).
 *
 * Big-day choreography (its own progress 0 → 1, over the first 300vh):
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
/** `holder`: the guest the passport is made out to (their group name). */
export function HeroBigDay({ holder }: { holder?: string }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const stageRef = useRef<HTMLDivElement>(null)
  // The stage's pinned length, read by the scroll transforms below.
  const lockedRef = useRef(lockedVh(deskNow()))
  const { scrollYProgress: stageProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })
  // The big day's own 0 → 1 (its first BIG_DAY_VH of pinned scroll), and the
  // vh scrolled past it, which drives the passport.
  const scrollYProgress = useTransform(stageProgress, (v: number) =>
    Math.min(1, (v * lockedRef.current) / BIG_DAY_VH)
  )
  const passVh = useTransform(stageProgress, (v: number) => v * lockedRef.current - BIG_DAY_VH)
  const reduced = useReducedMotion()

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
  const ext = useTransform(seam, (p: number) => (p * (100 + lockedRef.current) - 100) / BIG_DAY_VH)
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
  // Holds the hand-off rotation for the first few pixels of the seam,
  // where the previous section's sun still overlaps this one.
  const sunRiseRotate = useTransform(
    ext,
    (v: number) => SUN_HANDOFF_ROTATE + Math.max(0, v + 0.3) * 240
  )

  // Sun position (percent of the artwork box, see sunXAt / sunYAt).
  const sunXPct = useTransform(scrollYProgress, sunXAt)
  const sunYPct = useTransform(scrollYProgress, sunYAt)

  // The sun warms as it travels: golden on the rise, deeper orange as it
  // sets (0.30 → 0.85). It keeps turning slowly, carried on from the
  // flower's spin.
  // It also softens into the painting as it rises: a blur loosens the
  // detail and a warm glow bleeds from its edge, like pigment on wet
  // paper. Crisp while big at the hand-off, fully soft once in the sky.
  // (`ext` is the same scroll as scrollYProgress, extended into the seam.)
  const sunFilter = useTransform(ext, (v: number) => {
    const t = Math.min(1, Math.max(0, (v - 0.3) / 0.55))
    const soft = riseT(v)
    return [
      `hue-rotate(${(-16 * t).toFixed(1)}deg)`,
      `saturate(${(1 + 0.35 * t).toFixed(2)})`,
      `brightness(${(1 - 0.12 * t).toFixed(3)})`,
      `blur(${(SUN_BLUR_FINAL * soft).toFixed(2)}px)`,
      `drop-shadow(0 0 ${(9 * soft).toFixed(1)}px rgba(255, 196, 80, ${(0.6 * soft).toFixed(2)}))`,
    ].join(' ')
  })
  const sunRotate = useTransform(
    scrollYProgress,
    (v: number) => SUN_HANDOFF_ROTATE + Math.max(0, v + 0.3) * 240
  )

  // Info panel fades in once the sun has set.
  // …and leaves again as the painting starts turning into the passport.
  const infoOpacity = useTransform([scrollYProgress, passVh], ([v, pv]: number[]) => {
    const out = 1 - seg(pv, PHASE.infoOut)
    if (v < 0.85) return 0
    if (v < 0.92) return ((v - 0.85) / 0.07) * out
    return out
  })
  const infoVisibility = useTransform(infoOpacity, (o: number) => (o > 0.01 ? 'visible' : 'hidden'))
  const linesOpacity = useTransform(passVh, (pv: number) => 1 - seg(pv, PHASE.linesOut))

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
  // It fades with the info panel once the passport begins.
  const sunArcOpacity = useTransform([scrollYProgress, passVh], ([v, pv]: number[]) =>
    v < 0.3 ? 0 : 1 - seg(pv, PHASE.infoOut)
  )

  // ── Painting → passport ───────────────────────────────────────────────
  // Once the lines and the sun are gone, the finished painting (still by
  // now: CerradoPaint is fully drawn) is swapped for the passport cover's
  // own copy, pixel for pixel in place, which then carries it into the
  // cover (BrasiliaPassport / vignetteAt). This one just hides. Written
  // straight to the element's style, so no re-renders.
  const viewRef = useRef<HTMLDivElement>(null)
  const geo = useStageGeometry(viewRef)
  const desk = geo?.desk ?? deskNow()
  const locked = lockedVh(desk)
  useLayoutEffect(() => {
    lockedRef.current = locked
  })
  const compactRef = useRef<HTMLDivElement>(null)
  const compact = useCallback(
    (v: number) => {
      const el = compactRef.current
      if (!el) return
      if (reduced) {
        // No shrinking: the painting simply gives way to the open passport.
        el.style.opacity = String(1 - seg(v, [60, 110]))
        el.style.visibility = ''
        return
      }
      // From the swap on, the cover's own copy carries the painting
      // (BrasiliaPassport): this one, still, fades out under it.
      const { stage } = swapOpacities(v)
      el.style.opacity = stage >= 1 ? '' : String(stage)
      el.style.visibility = stage <= 0 ? 'hidden' : ''
    },
    [reduced]
  )
  useMotionValueEvent(passVh, 'change', compact)
  useLayoutEffect(() => compact(passVh.get()), [compact, passVh])
  const over = geo?.over ?? { l: 0, r: 0, b: 0 }
  // The set sun carries a CSS filter: out of the group altogether once it has
  // faded, so the shrinking, masked painting never re-renders it.
  const sunBoxVisibility = useTransform(passVh, (pv: number) =>
    pv >= PHASE.infoOut[1] ? 'hidden' : 'visible'
  )

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
  // In the script font a lone leading letter ("O Grande Dia") sits too close to
  // the next word, so it gets a little extra room.
  const [titleHead, ...titleRest] = t('wedding.title').split(' ')
  const titleTail = titleRest.join(' ')

  return (
    <section className="relative">
      <div ref={stageRef} className="relative" style={{ height: `${100 + locked}vh` }}>
        {/* What the Nav watches: the big day, then the passport (city guide),
            and where its "Brasília" link lands — the book just opened. */}
        <div
          id="wedding"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ height: `${CITY_MARK_VH}vh` }}
        />
        <div
          id="city"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ top: `${CITY_MARK_VH}vh` }}
        />
        <div
          id="passport"
          aria-hidden
          className="pointer-events-none absolute h-px w-px"
          style={{ top: `${passportAnchorVh(desk)}vh` }}
        />
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
          ref={viewRef}
          className="bg-peach sticky top-0 h-screen overflow-hidden [--art-top:44vh] md:[--art-top:14vh]"
          style={artVars}
        >
          {/* ── z-10  The landscape: painting, sun and line art, in one group
                    that hides at the hand-over to the passport. ── */}
          <div
            ref={compactRef}
            className="pointer-events-none absolute z-10"
            style={{
              left: -over.l,
              top: 0,
              width: `calc(100% + ${over.l + over.r}px)`,
              height: `calc(100% + ${over.b}px)`,
            }}
          >
            <div
              className="absolute top-0"
              style={{ left: over.l, width: `calc(100% - ${over.l + over.r}px)`, height: '100%' }}
            >
              {/* ── z-10  Watercolor painting (sky and ground) — painted in
                    around the sun as it travels, so the color follows its
                    arc. Slides up with the line art. ── */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute z-10 overflow-hidden"
                style={{ ...artBox, y: cerradoY, opacity: 0.9 }}
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
              <motion.div
                aria-hidden
                className="pointer-events-none absolute z-20"
                style={{
                  ...artBox,
                  visibility: sunBoxVisibility,
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
              </motion.div>

              {/* ── z-30  Pencil line art, registered onto the painting. SLIDES
                    UP from below the viewport alongside the sun shrink so
                    the drawing rises into place. ── */}
              <motion.img
                src={`${ART}/lines.webp`}
                alt=""
                aria-hidden
                draggable={false}
                style={{ ...artBox, y: cerradoY, opacity: linesOpacity }}
                className="pointer-events-none absolute z-30 max-w-none select-none"
              />
            </div>
          </div>

          {/* ── z-30  Soft paper fade behind the info strip so the text stays
                    readable over the top of the painted sky. ── */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-30"
            style={{
              opacity: infoOpacity,
              height: 'calc(var(--art-top) + var(--art-h) * 0.28)',
              background:
                'linear-gradient(to bottom, rgba(251, 250, 248, 0.92) 0%, rgba(251, 250, 248, 0.8) 45%, rgba(251, 250, 248, 0) 100%)',
            }}
          />

          {/* ── z-40  Horizontal top strip — three-column metadata row
                    (date + time · venue + directions · dress), vertically
                    centered in the region between the nav bar and the
                    top of the cerrado silhouette. ── */}
          <motion.div
            className="absolute inset-x-0 z-40 flex items-center px-8 md:px-12"
            style={{
              opacity: infoOpacity,
              visibility: infoVisibility,
              top: '8vh',
              // Down to just above the tree crowns.
              bottom: 'calc(100% - var(--art-top) - var(--art-h) * 0.17)',
            }}
          >
            <dl className="text-title mx-auto grid w-full max-w-[1600px] grid-cols-3 gap-x-4 gap-y-6 text-center md:gap-x-10">
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.venue')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-base leading-tight md:text-xl">
                  {CONFIG.wedding.venue}
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
                  {t('wedding.date')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-base leading-tight md:text-xl">
                  {dateStr}
                  <br />
                  {CONFIG.wedding.time}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.6rem] tracking-[0.35em] uppercase opacity-70 md:text-xs">
                  {t('wedding.dresscode')}
                </dt>
                <dd className="font-sans tabular-nums mt-2 text-base leading-tight md:text-xl">
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
              left: `clamp(9rem, calc(${artX(62)} - 70px), calc(100% - 9rem))`,
              top: `calc(${artY(40)} - 70px)`,
              x: '-50%',
              y: '-100%',
            }}
          >
            <p className="font-sans mb-5 text-[0.65rem] text-[#2a2a29] tracking-[0.4em] uppercase md:mb-6">
              {t('wedding.tagline')}
            </p>
            <h2 className="font-display text-[1.2rem] text-[#2a2a29] whitespace-nowrap md:text-2xl">
              {titleHead.length === 1 && titleTail ? (
                <>
                  <span className="mr-[0.2em]">{titleHead}</span> {titleTail}
                </>
              ) : (
                t('wedding.title')
              )}
            </h2>
          </motion.div>

          {/* ── z-40  The city guide, as a passport. ── */}
          <BrasiliaPassport progress={passVh} g={geo} reduced={reduced} holder={holder} />
        </div>
      </div>
    </section>
  )
}
