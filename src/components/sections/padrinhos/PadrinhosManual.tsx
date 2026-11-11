import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { useReducedMotion } from '../../motion/useReducedMotion'
import { CoverHalf, PanelFace, type Side } from './ManualFaces'
import { MANUAL_ASPECT } from './geometry'

/** Unfolding: a breath to see it shut, then the flaps open slowly, like card stock. */
const OPEN = { delay: 0.35, duration: 1.5, ease: [0.37, 0, 0.63, 1] as const }
const SHUT = { duration: 0.7, ease: [0.37, 0, 0.63, 1] as const }
/** Room either side of the open manual when it is wider than the screen. */
const PAD = 20
/** A sheet's own shadow, lying on the table. */
const SHEET_SHADOW =
  '0 26px 50px -26px rgba(60, 40, 15, 0.55), 0 4px 10px -6px rgba(60, 40, 15, 0.3)'

const viewport = () => ({ w: window.innerWidth, h: window.innerHeight })

/**
 * The padrinhos' manual, opened: a gatefold card that comes in shut and
 * unfolds left and right into three panels (CONFIG.padrinhos.panels). A
 * native modal dialog (focus kept inside, Esc closes), drawn above the page
 * in a portal so nothing on the desk's scroll stage can hide or move it.
 * Where the open card is wider than the screen (phones), it slides sideways
 * from panel to panel.
 */
export function PadrinhosManual({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'pt'
  const reduced = useReducedMotion()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  /** 0 shut → 1 open. */
  const turn = useMotionValue(0)
  // Lying fully open (the sideways arrows only then).
  const [unfolded, setUnfolded] = useState(false)
  useMotionValueEvent(turn, 'change', (v) => setUnfolded(v >= 1))
  const [view, setView] = useState(viewport)

  useEffect(() => {
    const onResize = () => setView(viewport())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // The shut card as large as the screen allows; open, it is twice as wide.
  const H = Math.min(view.h * 0.8, 780, (view.w * 0.86) / MANUAL_ASPECT)
  const W = H * MANUAL_ASPECT
  const flap = W / 2
  const openW = 2 * W
  const fits = openW + 2 * PAD <= view.w
  const trackW = fits ? view.w : openW + 2 * PAD

  const finish = useCallback(() => {
    dialogRef.current?.close()
    onClose()
  }, [onClose])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (reduced) return finish()
    // Folded shut again, then put away.
    animate(turn, 0, SHUT).then(finish)
  }, [finish, reduced, turn])

  useEffect(() => {
    const d = dialogRef.current
    if (!d || !open) return
    closing.current = false
    // The page stays where it is underneath (the gutter kept, so nothing on
    // the scroll stage is laid out again).
    const html = document.documentElement
    const before = { overflow: html.style.overflow, gutter: html.style.scrollbarGutter }
    html.style.scrollbarGutter = 'stable'
    html.style.overflow = 'hidden'
    if (!d.open) d.showModal()
    const s = scrollRef.current
    if (s) s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2
    let run: { stop: () => void } | null = null
    if (reduced) turn.set(1)
    else {
      turn.set(0)
      run = animate(turn, 1, OPEN)
    }
    return () => {
      run?.stop()
      html.style.overflow = before.overflow
      html.style.scrollbarGutter = before.gutter
      if (d.open) d.close()
    }
  }, [open, reduced, turn])

  const onBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close()
  }
  const slide = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * (flap + PAD), behavior: reduced ? 'auto' : 'smooth' })

  const [left, middle, right] = CONFIG.padrinhos.panels

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={t('padrinhos.label')}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClose={() => {
        // Closed some other way (a form, the browser): keep the state in step.
        if (!closing.current) onClose()
      }}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-[rgba(238,222,200,0.9)] backdrop:backdrop-blur-[6px]"
      style={{ overscrollBehavior: 'contain' }}
    >
      {open && (
        <>
          <h2 className="sr-only">{t('padrinhos.label')}</h2>
          <div
            ref={scrollRef}
            onClick={onBackdrop}
            className="h-full w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              overscrollBehavior: 'contain',
              scrollSnapType: fits ? undefined : 'x mandatory',
              touchAction: 'pan-x',
            }}
          >
            <div
              onClick={onBackdrop}
              className="relative flex h-full items-center"
              style={{ width: trackW }}
            >
              {!fits && (
                // Where a slide can stop: each flap whole at the edge, or the
                // middle centred.
                <>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0"
                    style={{ width: PAD + flap, scrollSnapAlign: 'start' }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-0"
                    style={{ left: PAD + flap, width: W, scrollSnapAlign: 'center' }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-y-0 right-0"
                    style={{ width: PAD + flap, scrollSnapAlign: 'end' }}
                  />
                </>
              )}
              <div
                className="relative"
                style={{
                  width: openW,
                  height: H,
                  marginLeft: fits ? (view.w - openW) / 2 : PAD,
                  perspective: H * 4,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* The middle panel, lying flat under the flaps. */}
                <div
                  className="absolute top-0"
                  style={{
                    left: flap,
                    width: W,
                    height: H,
                    boxShadow: SHEET_SHADOW,
                    transform: 'translateZ(-1px)',
                  }}
                >
                  <PanelFace panel={middle} lang={lang} h={H} wide />
                </div>
                <Flap side="left" turn={turn} w={flap} h={H}>
                  <PanelFace panel={left} lang={lang} h={H} wide={false} />
                </Flap>
                <Flap side="right" turn={turn} w={flap} h={H}>
                  <PanelFace panel={right} lang={lang} h={H} wide={false} />
                </Flap>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="font-sans text-forest-deep hover:bg-peach-light focus-visible:outline-forest absolute top-[max(14px,env(safe-area-inset-top))] right-[max(14px,env(safe-area-inset-right))] flex h-11 items-center gap-2 rounded-full bg-[#FBF6EC]/90 px-5 text-[0.7rem] tracking-[0.28em] uppercase shadow-[0_2px_10px_-4px_rgba(60,40,15,0.45)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {t('padrinhos.close')}
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
              <path
                d="M2 2l8 8M10 2l-8 8"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {!fits && unfolded && (
            <>
              <SlideButton dir={-1} label={t('padrinhos.prev')} onClick={() => slide(-1)} />
              <SlideButton dir={1} label={t('padrinhos.next')} onClick={() => slide(1)} />
            </>
          )}
        </>
      )}
    </dialog>,
    document.body
  )
}

/**
 * One flap: hinged on the middle panel's edge, folded in over it (its
 * outside, half the cover, showing) and turning out to lie flat beside it
 * (its inside, a panel). Which face shows is set by the angle, not left to
 * backface-visibility (WebKit draws turned-away faces).
 */
function Flap({
  side,
  turn,
  w,
  h,
  children,
}: {
  side: Side
  turn: MotionValue<number>
  w: number
  h: number
  children: ReactNode
}) {
  // Left flap: hinged on its right edge, turning towards the viewer as the
  // angle grows; the right flap mirrors it.
  const sign = side === 'left' ? 1 : -1
  const rotateY = useTransform(turn, (v) => sign * (1 - v) * 180)
  const outside = useTransform(turn, (v) => (v < 0.5 ? 'visible' : 'hidden'))
  const inside = useTransform(turn, (v) => (v < 0.5 ? 'hidden' : 'visible'))
  // Light falls off the card as it stands up, and back as it lies down.
  const shade = useTransform(turn, (v) => Math.sin(Math.PI * v) * 0.28)
  const face = 'absolute inset-0 [backface-visibility:hidden]'
  return (
    <motion.div
      className="absolute top-0"
      style={{
        left: side === 'left' ? 0 : w * 3,
        width: w,
        height: h,
        rotateY,
        transformOrigin: side === 'left' ? 'right center' : 'left center',
        transformStyle: 'preserve-3d',
        boxShadow: SHEET_SHADOW,
      }}
    >
      <motion.div className={face} style={{ visibility: inside }}>
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: shade,
            background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, rgba(70, 50, 20, 0.15), rgba(70, 50, 20, 0.55))`,
          }}
        />
      </motion.div>
      <motion.div className={face} style={{ visibility: outside, rotateY: 180 }}>
        <CoverHalf side={side} w={w} h={h} />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: shade, background: 'rgba(70, 50, 20, 0.4)' }}
        />
      </motion.div>
    </motion.div>
  )
}

function SlideButton({ dir, label, onClick }: { dir: -1 | 1; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`text-forest-deep hover:bg-peach-light focus-visible:outline-forest absolute bottom-[max(10px,env(safe-area-inset-bottom))] flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF6EC]/85 shadow-[0_2px_10px_-4px_rgba(60,40,15,0.45)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
        // A pair under the card, clear of its text.
        dir < 0 ? 'left-[calc(50%-52px)]' : 'right-[calc(50%-52px)]'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d={dir < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
