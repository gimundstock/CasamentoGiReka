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
    const pf = new PageFlip(host, {
      width,
      height,
      size: 'fixed',
      autoSize: false,
      usePortrait: portrait,
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: 0.35,
      flippingTime,
      showPageCorners: true,
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
    return () => {
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
      <div ref={hostRef} style={{ width: portrait ? width : 2 * width, height }} />
      {pages.map((el, i) => createPortal(renderPage(i), el, String(i)))}
    </div>
  )
})
