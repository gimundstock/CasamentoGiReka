import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ASSETS, PAINT_SRC } from './assets'
import type { PassportGeometry } from './geometry'
import { GOLD, Star } from './Pages'

/** The cathedral sketch: width as a fraction of the blot, and its height / width. */
const SKETCH_W = 0.48
const SKETCH_ASPECT = 590 / 900

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
  const { slot, art, focal, scale } = g
  return (
    <div className="absolute inset-0" style={{ fontSize: g.fontSize }}>
      {/* Board: cover.webp (cream, double gold rule, rounded corners in its
          alpha), stretched to the right page's footprint. */}
      <div
        ref={boardRef}
        className="absolute inset-0"
        style={{ background: `url(${ASSETS.cover}) center / 100% 100% no-repeat` }}
      />

      {/* Vignette — the painting, cut into the blot. */}
      <div
        ref={vignetteRef}
        className="absolute"
        style={{
          left: slot.x,
          top: slot.y,
          width: slot.w,
          height: slot.h,
          maskImage: ASSETS.blotMask,
          WebkitMaskImage: ASSETS.blotMask,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
      >
        <img
          src={PAINT_SRC}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            left: slot.w / 2 + (art.x - focal.x) * scale,
            top: slot.h / 2 + (art.y - focal.y) * scale,
            width: art.w * scale,
            height: art.h * scale,
            opacity: 0.9,
          }}
        />
      </div>

      {/* Title, star and the cathedral sketch. */}
      <div ref={titleRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <div className="absolute inset-x-0 top-[9.5%] flex flex-col items-center text-center">
          {/* -mr cancels the tracking after the last letter, so it centers. */}
          <p className="font-sans text-forest-deep/80 -mr-[0.5em] text-[0.7em] tracking-[0.5em] uppercase">
            {t('city.passport.kicker')}
          </p>
          {/* Room above: the script's capitals swing high. */}
          <p className="font-script text-honey mt-[0.35em] text-[3.3em] leading-[1.4]">
            {t('city.passport.title')}
          </p>
          <Star className="mt-[0.1em] h-[1.1em] w-[1.1em]" style={{ color: GOLD }} />
        </div>
        {/* Standing on the blot's lower right edge, half on the cream. */}
        <img
          src={ASSETS.coverSketch}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute select-none"
          style={{
            width: slot.w * SKETCH_W,
            left: slot.x + slot.w * 0.58,
            top: slot.y + slot.h * 1.04 - slot.w * SKETCH_W * SKETCH_ASPECT,
            opacity: 0.85,
          }}
        />
      </div>
    </div>
  )
}
