import { useImperativeHandle, useRef, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { CoverHalf, PanelFace, type Side } from './ManualFaces'

/** A sheet's own shadow, lying on the table. */
const SHEET_SHADOW =
  '0 26px 50px -26px rgba(60, 40, 15, 0.55), 0 4px 10px -6px rgba(60, 40, 15, 0.3)'

export interface GatefoldHandle {
  /** Unfolded `turn` of the way: 0 shut → 1 lying open. */
  set(turn: number): void
}

/**
 * The padrinhos' manual: a gatefold card, `w` × `h` shut, opening left and
 * right into three panels (CONFIG.padrinhos.panels), `2w` wide open. Laid
 * out open, `2w` wide, the middle panel in the middle; the flaps fold in
 * over it. Turned by the scroll, through `handle` (no re-renders).
 */
export function Gatefold({ w, h, handle }: { w: number; h: number; handle: Ref<GatefoldHandle> }) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'pt'
  const flap = w / 2
  const rootRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(handle, () => ({
    set(turn: number) {
      const root = rootRef.current
      if (!root) return
      const all = (q: string) => root.querySelectorAll<HTMLElement>(q)
      // Left flap: hinged on its right edge, turning towards the viewer as
      // it opens; the right flap mirrors it.
      const angle = ((1 - turn) * 180).toFixed(2)
      for (const el of all('[data-flap]')) {
        el.style.transform = `rotateY(${el.dataset.flap === 'left' ? '' : '-'}${angle}deg)`
      }
      // Which face shows is set by the angle, not left to
      // backface-visibility (WebKit draws turned-away faces).
      for (const el of all('[data-face="inside"]')) {
        el.style.visibility = turn >= 0.5 ? 'inherit' : 'hidden'
      }
      for (const el of all('[data-face="outside"]')) {
        el.style.visibility = turn < 0.5 ? 'inherit' : 'hidden'
      }
      // Light falls off the card as it stands up, and back as it lies down.
      const shade = (Math.sin(Math.PI * turn) * 0.28).toFixed(3)
      for (const el of all('[data-shade]')) el.style.opacity = shade
    },
  }))

  const [l, middle, r] = CONFIG.padrinhos.panels
  const renderFlap = (side: Side, panel: typeof l) => (
    <div
      data-flap={side}
      className="absolute top-0"
      style={{
        left: side === 'left' ? 0 : flap * 3,
        width: flap,
        height: h,
        transform: `rotateY(${side === 'left' ? 180 : -180}deg)`,
        transformOrigin: side === 'left' ? 'right center' : 'left center',
        transformStyle: 'preserve-3d',
        boxShadow: SHEET_SHADOW,
      }}
    >
      <div
        data-face="inside"
        className="absolute inset-0 [backface-visibility:hidden]"
        style={{ visibility: 'hidden' }}
      >
        <PanelFace panel={panel} lang={lang} h={h} wide={false} />
        <div
          data-shade
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: 0,
            background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(70, 50, 20, 0.15), rgba(70, 50, 20, 0.55))`,
          }}
        />
      </div>
      <div
        data-face="outside"
        aria-hidden
        className="absolute inset-0 [backface-visibility:hidden]"
        style={{ transform: 'rotateY(180deg)' }}
      >
        <CoverHalf side={side} w={flap} h={h} />
        <div
          data-shade
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: 0, background: 'rgba(70, 50, 20, 0.4)' }}
        />
      </div>
    </div>
  )

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ width: 2 * w, height: h, perspective: h * 4, transformStyle: 'preserve-3d' }}
    >
      {/* The middle panel, lying flat under the flaps. */}
      <div
        className="absolute top-0"
        style={{
          left: flap,
          width: w,
          height: h,
          boxShadow: SHEET_SHADOW,
          transform: 'translateZ(-1px)',
        }}
      >
        <PanelFace panel={middle} lang={lang} h={h} wide />
      </div>
      {renderFlap('left', l)}
      {renderFlap('right', r)}
    </div>
  )
}
