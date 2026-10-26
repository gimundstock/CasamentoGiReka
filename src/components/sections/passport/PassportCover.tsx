import type { CSSProperties, Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ASSETS, CATHEDRAL, PAINT_SRC } from './assets'
import { paintingBox, vignetteBox, type PassportGeometry } from './geometry'
import { ScriptText } from './Pages'

/** Font size of the cover's script title, as a fraction of the cover's width. */
const TITLE_EM = 0.16

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
  paintRef,
  cathedralRef,
  titleRef,
}: {
  g: PassportGeometry
  boardRef: Ref<HTMLDivElement>
  vignetteRef: Ref<HTMLDivElement>
  riseRef: Ref<HTMLDivElement>
  blotRef: Ref<HTMLDivElement>
  paintRef: Ref<HTMLDivElement>
  cathedralRef: Ref<HTMLImageElement>
  titleRef: Ref<HTMLDivElement>
}) {
  const { t } = useTranslation()
  const p = paintingBox(g)
  const frame = vignetteBox(g)
  const { slot } = g
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
        style={{ left: frame.x, top: frame.y, width: frame.w, height: frame.h }}
      >
        {/* Rise mask (frame), blot window, painting: nested, so the masks
            intersect. Positions and scales come from vignetteAt. */}
        <div ref={riseRef} className="absolute inset-0">
          <div
            ref={blotRef}
            className="absolute"
            style={{
              left: slot.x - frame.x,
              top: slot.y - frame.y,
              width: slot.w,
              height: slot.h,
              transformOrigin: 'center',
            }}
          >
            <div
              ref={paintRef}
              className="absolute"
              style={{
                left: p.x - slot.x,
                top: p.y - slot.y,
                width: p.w,
                height: p.h,
                transformOrigin: '0 0',
                opacity: 0.9,
              }}
            >
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
      </div>

      {/* Title, sized to the cover: "Brasília" spans ~75 % of the space
          inside the gold rule (the script is ~4 em wide), the spaced caps
          above in proportion. Centred in the cream above the painting. */}
      <div ref={titleRef} className="absolute inset-0" style={{ opacity: 0 }}>
        <div
          className="absolute inset-x-0 flex flex-col items-center text-center"
          style={{ top: g.coverBox.h * 0.05, fontSize: g.coverBox.w * TITLE_EM }}
        >
          {/* -mr cancels the tracking after the last letter, so it centers. */}
          <p className="font-sans text-forest-deep/80 -mr-[0.45em] text-[0.17em] tracking-[0.45em] uppercase">
            {t('city.passport.kicker')}
          </p>
          {/* Room above: the script's capitals swing high. */}
          <p className="font-script text-honey mt-[0.4em] leading-[1.2]">
            <ScriptText>{t('city.passport.title')}</ScriptText>
          </p>
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
