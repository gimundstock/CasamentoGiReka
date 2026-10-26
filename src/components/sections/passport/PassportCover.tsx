import type { CSSProperties, Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ASSETS, CATHEDRAL, PAINT_SRC } from './assets'
import { paintingBox, type PassportGeometry } from './geometry'
import { GOLD, ScriptText, Star } from './Pages'

/**
 * The passport's front cover.
 *
 * Three layers, back to front: the board (`boardRef`, faded in behind the
 * painting), the vignette, and the title (`titleRef`).
 *
 * The vignette is THE painting from the moment the stage's still painting
 * is swapped for it (same pixels, same place) until the book opens: its
 * transform carries it from the full screen into the cover, its mask cuts
 * it into the blot and bleeds it out into the rise shape, its clip keeps
 * it inside the gold rule — all set by the scroll (vignetteAt), so nothing
 * here but the box it ends up in. The cathedral (`cathedralRef`) is painted
 * in once the painting is small.
 */
export function PassportCover({
  g,
  boardRef,
  vignetteRef,
  riseRef,
  blotRef,
  cathedralRef,
  titleRef,
}: {
  g: PassportGeometry
  boardRef: Ref<HTMLDivElement>
  vignetteRef: Ref<HTMLDivElement>
  riseRef: Ref<HTMLDivElement>
  blotRef: Ref<HTMLDivElement>
  cathedralRef: Ref<HTMLImageElement>
  titleRef: Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const p = paintingBox(g)
  return (
    <div className="absolute inset-0" style={{ fontSize: g.fontSize }}>
      {/* Board: cover.webp (cream, double gold rule, rounded corners in its
          alpha), stretched to the right page's footprint. */}
      <div
        ref={boardRef}
        className="absolute inset-0"
        style={{ background: `url(${ASSETS.cover}) center / 100% 100% no-repeat`, opacity: 0 }}
      />

      {/* Vignette — the painting (see above). */}
      <div
        ref={vignetteRef}
        className="absolute"
        style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
      >
        {/* Rise mask, then blot mask: nested, so they intersect. */}
        <div ref={riseRef} className="absolute inset-0">
          <div ref={blotRef} className="absolute inset-0" style={{ opacity: 0.9 }}>
            <img
              src={PAINT_SRC}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full max-w-none select-none"
            />
            <Cathedral imgRef={cathedralRef} style={{ opacity: 0 }} />
          </div>
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
export function Cathedral({
  style,
  imgRef,
}: {
  style?: CSSProperties
  imgRef?: Ref<HTMLImageElement>
}) {
  const fade = 'linear-gradient(to bottom, #000 0%, #000 78%, transparent 100%)'
  return (
    <img
      ref={imgRef}
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
        ...style,
      }}
    />
  )
}
