import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js'

export interface FlipBookHandle {
  /** Turn to a page with the curl (it turns one leaf, whatever the distance). */
  flip(page: number): void
  /** Jump to a page with no animation. */
  turnTo(page: number): void
  /** True while a page is curling or being dragged. */
  busy(): boolean
}

interface Props {
  /** One page's size, px. */
  width: number
  height: number
  /** One page at a time (phones) instead of two-page spreads. */
  portrait: boolean
  count: number
  renderPage: (index: number) => ReactNode
  /** ms for one turn. */
  flippingTime: number
  onFlip: (page: number) => void
  className?: string
  style?: CSSProperties
}

type Render = {
  drawFrame: () => void
  update: () => void
  animation: unknown
  flippingPage: unknown
}

/**
 * A book of soft, curling pages: a small React wrapper around StPageFlip
 * (`page-flip`, MIT), used directly rather than through react-pageflip.
 *
 * The library owns the page elements (it moves them into its own block and
 * restyles them every frame), so React never renders them: they're created
 * once per mount, handed to the library, and React fills each with a
 * portal. Remount (change the `key`) to change the pages or the layout.
 *
 * StPageFlip redraws every page on every animation frame, forever. Here
 * that loop only draws while something moves (a turn, a drag, a peeled
 * corner) and for a few frames after, so an open book at rest costs
 * nothing — which matters on a page that is otherwise scroll-animated.
 */
export const FlipBook = forwardRef<FlipBookHandle, Props>(function FlipBook(
  { width, height, portrait, count, renderPage, flippingTime, onFlip, className, style },
  ref
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const pfRef = useRef<PageFlip | null>(null)
  const kickRef = useRef<() => void>(() => {})
  const [pages] = useState(() =>
    Array.from({ length: count }, () => {
      const el = document.createElement('div')
      el.className = 'passport-leaf'
      el.dataset.density = 'soft'
      return el
    })
  )
  const onFlipRef = useRef(onFlip)
  useLayoutEffect(() => {
    onFlipRef.current = onFlip
  })

  useLayoutEffect(() => {
    const frame = hostRef.current
    if (!frame) return
    // The library removes its root element on destroy, so it gets a fresh
    // one per mount (StrictMode mounts twice).
    const host = document.createElement('div')
    host.style.width = '100%'
    host.style.height = '100%'
    frame.appendChild(host)
    // Touch screens may swipe pages (the library's own gesture, which leaves
    // vertical scrolling alone); with a mouse, pages turn by click only — no
    // dragging, no corner peeling on hover.
    const touch = window.matchMedia('(pointer: coarse)').matches
    const pf = new PageFlip(host, {
      width,
      height,
      size: 'fixed',
      autoSize: false,
      usePortrait: portrait,
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: 0.3,
      flippingTime,
      useMouseEvents: touch,
      showPageCorners: false,
      disableFlipByClick: true,
      mobileScrollSupport: true,
    })
    pf.loadFromHTML(pages)

    // Draw only while something moves, and a few frames after.
    const render = pf.getRender() as Render
    const draw = render.drawFrame.bind(render)
    const update = render.update.bind(render)
    let fresh = 4
    const kick = () => {
      fresh = 4
    }
    render.drawFrame = () => {
      if (render.animation !== null || render.flippingPage !== null || pf.getState() !== 'read') {
        fresh = 4
      }
      if (fresh > 0) {
        fresh--
        draw()
        paperShadows(host)
      }
    }
    render.update = () => {
      update()
      kick()
    }
    kickRef.current = kick

    pf.on('flip', (e) => {
      kick()
      onFlipRef.current(Number(e.data))
    })
    pf.on('changeState', kick)
    pfRef.current = pf
    // Mouse: a click on a page turns it (left page back, right page on),
    // unless it lands on a link or a button in the page.
    const onClick = (e: MouseEvent) => {
      if (touch || pf.getState() !== 'read') return
      if ((e.target as HTMLElement).closest('a, button')) return
      const r = host.getBoundingClientRect()
      const back = e.clientX - r.left < r.width / 2
      kick()
      if (back) pf.flipPrev()
      else pf.flipNext()
    }
    host.addEventListener('click', onClick)
    return () => {
      host.removeEventListener('click', onClick)
      pf.destroy()
      pfRef.current = null
    }
    // One book per mount (see the doc comment): the parent changes `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useImperativeHandle(ref, () => ({
    flip: (page) => {
      kickRef.current()
      pfRef.current?.flip(page)
    },
    turnTo: (page) => {
      const pf = pfRef.current
      if (!pf || pf.getCurrentPageIndex() === page) return
      pf.turnToPage(page)
      kickRef.current()
    },
    busy: () => (pfRef.current ? pfRef.current.getState() !== 'read' : false),
  }))

  return (
    <div className={className} style={style}>
      {/* No text selection: a mouse drag over the pages must do nothing. */}
      <div
        ref={hostRef}
        className="select-none"
        style={{ width: portrait ? width : 2 * width, height }}
      />
      {pages.map((el, i) => createPortal(renderPage(i), el, String(i)))}
    </div>
  )
})

/**
 * The library's shadows are black gradients, and the one on the curling page
 * has a light band between two dark ones: it reads as metal. Re-tint them
 * warm, and make the curl's a single soft falloff from the fold.
 */
function paperShadows(host: HTMLElement) {
  const warm = (bg: string) => bg.replace(/rgba\(0, 0, 0,/g, 'rgba(120, 86, 40,')
  for (const cls of ['stf__outerShadow', 'stf__hardShadow', 'stf__hardInnerShadow']) {
    const el = host.querySelector<HTMLElement>(`.${cls}`)
    if (el && el.style.background) el.style.background = warm(el.style.background)
  }
  const inner = host.querySelector<HTMLElement>('.stf__innerShadow')
  const bg = inner?.style.background
  if (inner && bg) {
    const dir = /linear-gradient\(([^,]+),/.exec(bg)?.[1] ?? 'to right'
    const op = Number(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/.exec(bg)?.[1] ?? 0)
    inner.style.background =
      `linear-gradient(${dir}, rgba(120, 86, 40, ${(op * 0.7).toFixed(3)}) 0%, ` +
      `rgba(120, 86, 40, ${(op * 0.25).toFixed(3)}) 25%, rgba(120, 86, 40, 0) 60%)`
  }
}
