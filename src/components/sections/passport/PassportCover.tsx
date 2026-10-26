import type { CSSProperties, Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ASSETS, CATHEDRAL, COVER_RULE, MASK, PAINT_SRC } from './assets'
import { bleedMask, type PassportGeometry } from './geometry'
import { GOLD, ScriptText, Star } from './Pages'

/**
 * The passport's front cover.
 *
 * Three layers: the cream board (`boardRef`, clipped by the scroll so it
 * grows out from under the vignette), the vignette itself, and the title
 * (`titleRef`, faded in by the scroll).
 *
 * The vignette is a copy of the painting placed EXACTLY where HeroBigDay's
 * shrunken painting ends up — same crop, same scale, same blot — so when the
 * stage hands over from that one to this one nothing moves (`vignetteRef`
 * fades it in on top first). From then on it belongs to the cover and turns
 * with it.
 */
export function PassportCover({
  g,
  boardRef,
  vignetteRef,
  titleRef,
}: {
  g: PassportGeometry
  boardRef: Ref<HTMLDivElement>
  vignetteRef: Ref<HTMLDivElement>
  titleRef: Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const { slot, inner, art, focal, scale } = g
  // The painting's own box, in the frame's coordinates (inside the gold
  // rule): where HeroBigDay's shrinking painting ends up. It never moves
  // here; only its mask changes.
  const px = slot.x + slot.w / 2 + (art.x - focal.x) * scale - inner.x
  const py = slot.y + slot.h / 2 + (art.y - focal.y) * scale - inner.y
  const pw = art.w * scale
  const ph = art.h * scale
  const r = g.coverBox.w * COVER_RULE.radius
  const start = bleedMask(g, 0)
  return (
    <div className="absolute inset-0" style={{ fontSize: g.fontSize }}>
      {/* Board: cover.webp (cream, double gold rule, rounded corners in its
          alpha), stretched to the right page's footprint. */}
      <div
        ref={boardRef}
        className="absolute inset-0"
        style={{ background: `url(${ASSETS.cover}) center / 100% 100% no-repeat` }}
      />

      {/* Vignette — the painting, inside the gold rule. Its mask is the
          blot INTERSECTED with the rise shape: at first the rise box is big
          enough to hold the whole blot, so only the blot shows; then the
          blot grows out past the frame while the rise box settles into
          place, so the paint bleeds outward and stops at the rise's soft
          top and the rule (bleedMask, driven by the scroll). */}
      <div
        ref={vignetteRef}
        className="absolute"
        style={{
          left: inner.x,
          top: inner.y,
          width: inner.w,
          height: inner.h,
          maskImage: `${MASK.blot.image}, ${MASK.rise.image}`,
          WebkitMaskImage: `${MASK.blot.image}, ${MASK.rise.image}`,
          maskSize: start.size,
          WebkitMaskSize: start.size,
          maskPosition: start.position,
          WebkitMaskPosition: start.position,
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          borderRadius: r,
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute"
          style={{ left: px, top: py, width: pw, height: ph, opacity: 0.9 }}
        >
          <img
            src={PAINT_SRC}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full max-w-none select-none"
          />
          <Cathedral />
        </div>
      </div>

      {/* Title and star. */}
      <div ref={titleRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <div className="absolute inset-x-0 top-[9.5%] flex flex-col items-center text-center">
          {/* -mr cancels the tracking after the last letter, so it centers. */}
          <p className="font-sans text-forest-deep/80 -mr-[0.5em] text-[0.7em] tracking-[0.5em] uppercase">
            {t('city.passport.kicker')}
          </p>
          {/* Room above: the script's capitals swing high. */}
          <p className="font-script text-honey mt-[0.35em] text-[3.3em] leading-[1.4]">
            <ScriptText>{t('city.passport.title')}</ScriptText>
          </p>
          <Star className="mt-[0.1em] h-[1.1em] w-[1.1em]" style={{ color: GOLD }} />
        </div>
      </div>
    </div>
  )
}

/**
 * The watercolor cathedral standing on the far hills of the painting, inside
 * a box the size of the painting. Its base melts into the hills, so it reads
 * as painted in rather than pasted on.
 */
export function Cathedral({ style }: { style?: CSSProperties }) {
  const fade = 'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)'
  return (
    <img
      src={CATHEDRAL.src}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute max-w-none select-none"
      style={{
        width: `${CATHEDRAL.w * 100}%`,
        left: `${(CATHEDRAL.cx - CATHEDRAL.w / 2) * 100}%`,
        bottom: `${(1 - CATHEDRAL.base) * 100}%`,
        maskImage: fade,
        WebkitMaskImage: fade,
        opacity: 0.92,
        ...style,
      }}
    />
  )
}
