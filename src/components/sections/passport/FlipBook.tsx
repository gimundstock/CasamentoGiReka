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
  /** A turn by click or `flip` begins, towards this page (`onFlip` fires as it lands). */
  onTurn?: (page: number) => void
  className?: string
  style?: CSSProperties
}

type Render = {
  drawFrame: () => void
  update: () => void
  animation: unknown
  flippingPage: unknown
}

// The library's internals the reversed turn back drives (not in its types).
type Point = { x: number; y: number }
type FlipController = {
  calc: unknown
  flipPrev: (corner?: string) => void
  start: (globalPos: Point) => boolean
  do: (pagePos: Point) => void
  setState: (state: string) => void
  reset: () => void
}
type FlipRender = {
  getRect: () => { left: number; pageWidth: number; height: number }
  startAnimation: (frames: (() => void)[], duration: number, onEnd: () => void) => void
  finishAnimation: () => void
  setBottomPage: (page: null) => void
  setFlippingPage: (page: null) => void
  clearShadow: () => void
  setRightPage: (page: unknown) => void
}
type PageCollection = {
  currentSpreadIndex: number
  currentPageIndex: number
  pages: unknown[]
  getCurrentSpreadIndex: () => number
  show: (page: number) => void
}

/** One point per px along a line, as the library animates a turn. */
function line(a: Point, b: Point): Point[] {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))))
  return Array.from({ length: n + 1 }, (_, i) => ({
    x: a.x + ((b.x - a.x) * i) / n,
    y: a.y + ((b.y - a.y) * i) / n,
  }))
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
  { width, height, portrait, count, renderPage, flippingTime, onFlip, onTurn, className, style },
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
  const onTurnRef = useRef(onTurn)
  useLayoutEffect(() => {
    onFlipRef.current = onFlip
    onTurnRef.current = onTurn
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

    // One page at a time, the library's own turn back slides the previous page
    // in from off the book (and never started at all: its corner test assumes
    // two pages). Turning back here is the turn forward played in reverse:
    // the previous page starts curled away to the left and lays back down
    // over this one. Buttons, tabs and swipes all come through flipPrev.
    if (portrait) {
      const fc = (pf as unknown as { flipController: FlipController }).flipController
      const render = pf.getRender() as unknown as Render & FlipRender
      const pc = pf.getPageCollection() as unknown as PageCollection
      fc.flipPrev = (corner) => {
        const to = pc.getCurrentSpreadIndex() - 1
        if (to < 0) return
        if (fc.calc !== null) render.finishAnimation()
        // As if on the previous page, about to turn it.
        pc.currentSpreadIndex = to
        pc.currentPageIndex = to
        const r = render.getRect()
        const top = corner !== 'bottom'
        if (!fc.start({ x: r.left + r.pageWidth * 2 - 10, y: top ? 1 : r.height - 2 })) {
          pc.show(to + 1)
          return
        }
        // The part still lying flat is the previous page's (its 'flip' event
        // waits for the landing, as a turn forward's does).
        render.setRightPage(pc.pages[to])
        fc.setState('flipping')
        // The forward turn's path, backwards: from fully turned to the corner
        // it was lifted at, then the last few px flat into the corner.
        const margin = r.height / 10
        const edge = top ? 0 : r.height
        const path = [
          ...line(
            { x: -r.pageWidth, y: edge },
            { x: r.pageWidth - margin, y: top ? margin : r.height - margin }
          ),
          ...line(
            { x: r.pageWidth - margin, y: top ? margin : r.height - margin },
            { x: r.pageWidth, y: edge }
          ),
        ]
        fc.do(path[0])
        const frames = path.map((p) => () => fc.do(p))
        const ms = flippingTime * Math.min(1, path.length / 1000)
        render.startAnimation(frames, ms, () => {
          if (fc.calc === null) return
          render.setBottomPage(null)
          render.setFlippingPage(null)
          render.clearShadow()
          fc.setState('read')
          fc.reset()
          pc.show(to)
        })
      }
    }

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
      const step = portrait ? 1 : 2
      const to = pf.getCurrentPageIndex() + (back ? -step : step)
      if (to >= 0 && to < count) onTurnRef.current?.(to)
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
      onTurnRef.current?.(page)
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
