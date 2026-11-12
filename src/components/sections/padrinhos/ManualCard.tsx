import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { Cover, CoverArt, PageFace } from './ManualFaces'

/** A sheet's own shadow, lying on the table. */
const SHEET_SHADOW =
  '0 26px 50px -26px rgba(60, 40, 15, 0.55), 0 4px 10px -6px rgba(60, 40, 15, 0.3)'

export interface ManualCardHandle {
  /**
   * `open`: the cover turned over to the left, 0 → 1 (the card lying open);
   * `close`: then the right half turned over onto the left, 0 → 1 (the card
   * shut again, its back up).
   */
  set(open: number, close?: number): void
}

/**
 * The padrinhos' manual: a folded card, `w` × `h` shut (the passport's
 * cover), as a greeting card is read. Shut, its cover; the cover turns over
 * from right to left, and it lies open — the inside of the cover on the
 * left (the cover's painting mirrored), its page on the right
 * (CONFIG.padrinhos.page); then the right half turns over from right to
 * left too, and it lies shut on its back (the painting, no words). Laid
 * out open, `2w` wide, the fold in the middle; shut, it is moved half a
 * page so the shut card is where the open one is centred. Turned by the
 * scroll, through `handle` (no re-renders).
 */
export function ManualCard({
  w,
  h,
  radius,
  handle,
}: {
  w: number
  h: number
  /** Its outer corners' radius, px. */
  radius: number
  handle: Ref<ManualCardHandle>
}) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'pt'
  const rootRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(handle, () => ({
    set(open: number, close = 0) {
      const root = rootRef.current
      if (!root) return
      const one = (q: string) => root.querySelector<HTMLElement>(q)
      // Shut on the right half, then open across both, then shut on the left.
      const shift = one('[data-shift]')
      if (shift)
        shift.style.transform = `translate3d(${((close - (1 - open)) * w * 0.5).toFixed(2)}px, 0, 0)`
      // The left half (the cover outside): hinged on its right edge, lying
      // over the right half shut, turning out to the left. Over the right
      // half until it is turned; under it once that is turned over it.
      const left = one('[data-half="left"]')
      if (left) {
        left.style.transform = `rotateY(${(180 * (1 - open)).toFixed(2)}deg)`
        left.style.zIndex = close > 0 ? '1' : '2'
      }
      // The right half (the back outside): hinged on its left edge, turning
      // over onto the left half.
      const right = one('[data-half="right"]')
      if (right) {
        right.style.transform = `rotateY(${(-180 * close).toFixed(2)}deg)`
        right.style.zIndex = close > 0 ? '2' : '1'
      }
      // Which face shows is set by the angle. (A face turned away is drawn
      // mirrored: the back faces are mirrored back, rotateY(180deg).)
      const show = (q: string, on: boolean) => {
        const el = one(q)
        if (el) el.style.visibility = on ? 'inherit' : 'hidden'
      }
      show('[data-face="cover"]', open < 0.5)
      show('[data-face="inside"]', open >= 0.5)
      show('[data-face="page"]', close < 0.5)
      show('[data-face="back"]', close >= 0.5)
      // Light falls off a half as it stands up, and back as it lies down.
      const shade = (t: number) => (Math.sin(Math.PI * t) * 0.28).toFixed(3)
      for (const el of root.querySelectorAll<HTMLElement>('[data-shade="left"]'))
        el.style.opacity = shade(open)
      for (const el of root.querySelectorAll<HTMLElement>('[data-shade="right"]'))
        el.style.opacity = shade(close)
    },
  }))

  const [left, right] = CONFIG.padrinhos.pages
  const r = `${radius.toFixed(1)}px`
  const outerLeft = `${r} 0 0 ${r}`
  const outerRight = `0 ${r} ${r} 0`
  /** One face of a half: `back` is the face turned away to start with. */
  const face = (
    name: string,
    back: boolean,
    corners: string,
    shade: string,
    children: ReactNode,
    hidden: boolean
  ) => (
    <div
      data-face={name}
      className="absolute inset-0"
      style={{
        borderRadius: corners,
        boxShadow: SHEET_SHADOW,
        transform: back ? 'rotateY(180deg)' : undefined,
        visibility: hidden ? 'hidden' : undefined,
      }}
    >
      {children}
      <div
        data-shade={shade}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0, borderRadius: 'inherit', background: 'rgba(70, 50, 20, 0.35)' }}
      />
    </div>
  )
  return (
    // Each half is turned in its own perspective and the two are stacked by
    // z-index (which is on top changes as they turn), not depth-sorted in
    // one 3D scene: WebKit draws such a scene's level, overlapping planes
    // in page order.
    <div ref={rootRef} className="relative" style={{ width: 2 * w, height: h }}>
      <div
        data-shift
        className="absolute inset-0"
        style={{ transform: `translate3d(${-w * 0.5}px, 0, 0)`, perspective: w * 8 }}
      >
        {/* The right half: the page inside; the back outside. */}
        <div
          data-half="right"
          className="absolute top-0"
          style={{ left: w, width: w, height: h, transformOrigin: 'left center', zIndex: 1 }}
        >
          {face(
            'page',
            false,
            outerRight,
            'right',
            <PageFace page={right} lang={lang} h={h} flowers />,
            false
          )}
          {face('back', true, outerLeft, 'right', <CoverArt />, true)}
        </div>
        {/* The left half: the cover outside (lying over the right half, shut);
            the cover's painting mirrored inside. */}
        <div
          data-half="left"
          className="absolute top-0 left-0"
          style={{
            width: w,
            height: h,
            transform: 'rotateY(180deg)',
            transformOrigin: 'right center',
            zIndex: 2,
          }}
        >
          {face(
            'inside',
            false,
            outerLeft,
            'left',
            <PageFace page={left} lang={lang} h={h} flowers mirrored />,
            true
          )}
          {face('cover', true, outerRight, 'left', <Cover w={w} h={h} />, false)}
        </div>
      </div>
    </div>
  )
}
