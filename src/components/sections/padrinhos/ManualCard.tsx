import { useImperativeHandle, useRef, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { Cover, CoverInside, PageFace } from './ManualFaces'

/** A sheet's own shadow, lying on the table. */
const SHEET_SHADOW =
  '0 26px 50px -26px rgba(60, 40, 15, 0.55), 0 4px 10px -6px rgba(60, 40, 15, 0.3)'

/** The open cover's: no close shadow at the spine. */
const SPREAD_SHADOW = '0 26px 50px -26px rgba(60, 40, 15, 0.5)'

export interface ManualCardHandle {
  /** Opened `turn` of the way: 0 shut → 1 lying open. */
  set(turn: number): void
}

/**
 * The padrinhos' manual: a folded card, `w` × `h` shut (the passport's
 * cover), its spine on the right (where its title runs up it). Its cover
 * opens over to the right, onto its one page (CONFIG.padrinhos.page); the
 * inside of the cover, facing it, is the cover's painting mirrored. It
 * shuts back from right to left. Laid out open, `2w` wide, the page on the
 * left; shut, it moves half a page right so the shut card is where the
 * open one is centred. Turned by the scroll, through `handle` (no
 * re-renders).
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
    set(turn: number) {
      const root = rootRef.current
      if (!root) return
      const one = (q: string) => root.querySelector<HTMLElement>(q)
      const shift = one('[data-shift]')
      if (shift) shift.style.transform = `translate3d(${((1 - turn) * w * 0.5).toFixed(2)}px, 0, 0)`
      const cover = one('[data-cover]')
      if (cover) cover.style.transform = `rotateY(${(180 * turn).toFixed(2)}deg)`
      // Which face shows is set by the angle, not left to
      // backface-visibility (WebKit draws turned-away faces).
      const front = one('[data-face="front"]')
      if (front) front.style.visibility = turn < 0.5 ? 'inherit' : 'hidden'
      const back = one('[data-face="back"]')
      if (back) back.style.visibility = turn >= 0.5 ? 'inherit' : 'hidden'
      // Light falls off the cover as it stands up, and back as it lies down.
      const shade = (Math.sin(Math.PI * turn) * 0.28).toFixed(3)
      for (const el of root.querySelectorAll<HTMLElement>('[data-shade]')) el.style.opacity = shade
    },
  }))

  const r = `${radius.toFixed(1)}px`
  return (
    <div ref={rootRef} className="relative" style={{ width: 2 * w, height: h, perspective: w * 8 }}>
      <div
        data-shift
        className="absolute inset-0"
        style={{ transform: `translate3d(${w * 0.5}px, 0, 0)`, transformStyle: 'preserve-3d' }}
      >
        {/* The page, under the cover. */}
        <div
          className="absolute top-0 left-0"
          style={{
            width: w,
            height: h,
            borderRadius: `${r} 0 0 ${r}`,
            boxShadow: SHEET_SHADOW,
            transform: 'translateZ(-1px)',
          }}
        >
          <PageFace page={CONFIG.padrinhos.page} lang={lang} h={h} flowers />
        </div>
        {/* The cover, hinged on its right edge (the spine). */}
        <div
          data-cover
          className="absolute top-0 left-0"
          style={{
            width: w,
            height: h,
            transformOrigin: 'right center',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            data-face="front"
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ borderRadius: `${r} 0 0 ${r}` }}
          >
            <Cover w={w} h={h} />
            <div
              data-shade
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: 0,
                borderRadius: 'inherit',
                background: 'rgba(70, 50, 20, 0.4)',
              }}
            />
          </div>
          <div
            data-face="back"
            aria-hidden
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{
              visibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: `0 ${r} ${r} 0`,
              boxShadow: SPREAD_SHADOW,
            }}
          >
            <CoverInside />
            <div
              data-shade
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: 0,
                borderRadius: 'inherit',
                background:
                  'linear-gradient(to left, rgba(70, 50, 20, 0.15), rgba(70, 50, 20, 0.55))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
