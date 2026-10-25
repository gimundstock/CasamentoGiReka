import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { buildBook, pageSection, sectionEntries, SECTIONS, type Chunks } from './content'
import type { PageSpec, SectionKey } from './content'
import { BOOK } from './assets'
import { ease, PHASE, seg, TAB_OUT, type PassportGeometry, type Rect } from './geometry'
import { PassportCover } from './PassportCover'
import { EntriesFrame, EntryItem, GOLD, PageContent, Paper, pageRadius, type Side } from './Pages'

type Lang = 'pt' | 'en'

/** Until the entries are measured: three per page. */
const FALLBACK_CHUNKS = Object.fromEntries(
  SECTIONS.map((s) => {
    const n = sectionEntries(s, 'pt').length
    const ranges: [number, number][] = []
    for (let i = 0; i < n; i += 3) ranges.push([i, Math.min(n, i + 3)])
    return [s, ranges]
  })
) as Chunks

/** How long one page takes to turn. Slow, like a real leaf settling. */
const FLIP = { duration: 1.15, ease: [0.42, 0.04, 0.22, 1] as const }

const hidden3d: CSSProperties = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

/**
 * The city guide as a passport — the second half of HeroBigDay's sticky stage.
 *
 * Scroll-driven until it is open (`progress` is vh of scroll past the big
 * day, see PHASE): the cover grows around the painting HeroBigDay has shrunk
 * into its blot, then turns over to the left. From there it is a book you
 * click through: tabs on the right edge jump to a chapter, arrows turn one
 * page. Each change turns a leaf around the spine.
 *
 * Everything scroll-driven is written straight to the elements' style in
 * `update` (transform / opacity / clip-path only), so scrolling never
 * re-renders React. On phones (`g.spread === false`) the book shows one page
 * at a time.
 */
export function BrasiliaPassport({
  progress,
  g,
  reduced,
}: {
  progress: MotionValue<number>
  g: PassportGeometry | null
  reduced: boolean
}) {
  const { t, i18n } = useTranslation()
  const lang: Lang = i18n.language === 'en' ? 'en' : 'pt'

  // ── Pagination: measure every entry at the real page size ─────────────
  // A ResizeObserver on the measuring copy re-paginates whenever the page
  // size, the language or a late-loading font changes what fits.
  const listMeasureRef = useRef<HTMLDivElement>(null)
  const itemsMeasureRef = useRef<HTMLDivElement>(null)
  const [chunks, setChunks] = useState<Chunks>(FALLBACK_CHUNKS)
  const hasGeometry = g !== null
  useEffect(() => {
    const list = listMeasureRef.current
    const items = itemsMeasureRef.current
    if (!list || !items) return
    const paginate = () => {
      const avail = list.clientHeight
      const next = {} as Chunks
      for (const s of SECTIONS) {
        const els = Array.from(items.querySelectorAll<HTMLElement>(`[data-sec="${s}"]`))
        const ranges: [number, number][] = []
        let from = 0
        let used = 0
        els.forEach((el, i) => {
          const h = el.offsetHeight
          if (i > from && used + h > avail) {
            ranges.push([from, i])
            from = i
            used = 0
          }
          used += h
        })
        ranges.push([from, els.length])
        next[s] = ranges
      }
      setChunks((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
    }
    const ro = new ResizeObserver(paginate)
    ro.observe(list)
    ro.observe(items)
    return () => ro.disconnect()
  }, [hasGeometry])

  const book = useMemo(() => buildBook(chunks), [chunks])
  const spread = g?.spread ?? true
  const count = spread ? book.spreads.length : book.pages.length

  // ── Click navigation ───────────────────────────────────────────────────
  const [opened, setOpened] = useState(false)
  const [cur, setCur] = useState(0)
  const [flip, setFlip] = useState<{ to: number; dir: 1 | -1 } | null>(null)
  const leafRot = useMotionValue(0)
  const flipAnim = useRef<ReturnType<typeof animate> | null>(null)

  // A different layout (spread ↔ single) or language re-paginates: start over.
  const layoutKey = `${spread}-${lang}`
  const [seenLayout, setSeenLayout] = useState(layoutKey)
  if (seenLayout !== layoutKey) {
    setSeenLayout(layoutKey)
    setFlip(null)
    setCur(0)
  }
  useEffect(() => () => flipAnim.current?.stop(), [layoutKey])

  const go = useCallback(
    (to: number) => {
      if (flip || to === cur || to < 0 || to >= count) return
      const dir = to > cur ? 1 : -1
      if (reduced) {
        setCur(to)
        return
      }
      // Spread: the leaf turns from right to left (forward) or back. Single
      // page: forward, the page lifts off to the left; back, it comes in from there.
      const from = !spread && dir === -1 ? -180 : 0
      const target = spread ? -180 * dir : dir === 1 ? -180 : 0
      leafRot.set(from)
      setFlip({ to, dir })
      flipAnim.current = animate(leafRot, target, {
        ...FLIP,
        onComplete: () => {
          setCur(to)
          setFlip(null)
        },
      })
    },
    [flip, cur, count, reduced, spread, leafRot]
  )
  const goSection = (s: SectionKey) => go(spread ? book.firstSpread[s] : book.firstPage[s])

  // ── Scroll-driven part ─────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const leftHalfRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const hazeRef = useRef<HTMLDivElement>(null)
  const curRef = useRef(cur)
  useLayoutEffect(() => {
    curRef.current = cur
  })

  const update = useCallback(
    (v: number) => {
      const root = rootRef.current
      const bookEl = bookRef.current
      const cover = coverRef.current
      const board = boardRef.current
      const title = titleRef.current
      const base = baseRef.current
      const chrome = chromeRef.current
      const haze = hazeRef.current
      if (!g || !root || !bookEl || !cover || !board || !title || !base || !chrome || !haze) return
      const left = leftRef.current
      const leftHalf = leftHalfRef.current
      const vignette = vignetteRef.current
      const show = (el: HTMLElement | null, o: number) => {
        if (!el) return
        el.style.opacity = String(o)
        el.style.visibility = o > 0 ? 'visible' : 'hidden'
      }

      if (reduced) {
        // No transition: the open book simply fades in over the painting.
        const o = seg(v, [60, 110])
        root.style.visibility = o > 0 ? 'visible' : 'hidden'
        root.style.opacity = String(o)
        bookEl.style.transform = 'none'
        cover.style.visibility = 'hidden'
        show(base, 1)
        show(leftHalf, 1)
        show(left, 1)
        chrome.style.opacity = '1'
        haze.style.opacity = '1'
        return o > 0.5
      }

      root.style.visibility = v >= PHASE.handoff[0] ? 'visible' : 'hidden'
      root.style.opacity = '1'
      // The cover's vignette fades in over HeroBigDay's (now still) painting;
      // the board stays hidden until it's fully there, or its cream would
      // show through the half-faded vignette.
      if (vignette) vignette.style.opacity = String(seg(v, PHASE.handoff))
      board.style.visibility = v >= PHASE.handoff[1] ? 'visible' : 'hidden'

      // Cover board grows out from under the vignette: its clip starts as
      // a rounded box inside the blot's opaque core, ends as the card.
      const grow = ease(seg(v, PHASE.coverGrow))
      const { slot, page } = g
      const cw = slot.w * 0.6
      const ch = slot.h * 0.6
      const cx = slot.x + slot.w / 2
      const cy = slot.y + slot.h / 2
      const k = 1 - grow
      const clip =
        `inset(${((cy - ch / 2) * k).toFixed(1)}px ${((page.w - cx - cw / 2) * k).toFixed(1)}px ` +
        `${((page.h - cy - ch / 2) * k).toFixed(1)}px ${((cx - cw / 2) * k).toFixed(1)}px ` +
        `round ${((ch / 2) * k + 10 * grow).toFixed(1)}px)`
      board.style.clipPath = clip
      board.style.setProperty('-webkit-clip-path', clip)

      const tt = ease(seg(v, PHASE.title))
      title.style.opacity = String(tt)
      title.style.transform = `translate3d(0, ${((1 - tt) * 8).toFixed(1)}px, 0)`

      const o = ease(seg(v, PHASE.open))
      bookEl.style.transform = `translate3d(${(g.closedShift * (1 - o)).toFixed(1)}px, 0, 0)`
      cover.style.transform = `rotateY(${(-180 * o).toFixed(2)}deg)`
      cover.style.visibility = o >= 1 ? 'hidden' : 'visible'
      // One page at a time: the turned cover would hang off the left edge.
      cover.style.opacity = spread ? '1' : String(1 - seg(o, [0.4, 0.9]))
      // The book's edge and page stack appear as the board finishes growing;
      // the left half as the cover comes down over it; its page's text
      // only once the cover lies flat (the cover's back face shows the same).
      show(base, seg(grow, [0.7, 1]))
      show(leftHalf, seg(o, [0.45, 0.75]))
      show(left, o >= 1 ? 1 : 0)
      chrome.style.opacity = String(seg(v, [PHASE.open[1] - 25, PHASE.open[1]]))
      haze.style.opacity = String(grow)
      return o >= 1
    },
    [g, reduced, spread]
  )
  useMotionValueEvent(progress, 'change', (v) => {
    const isOpen = update(v) ?? false
    setOpened(isOpen)
    // Scrolled back into the transition: the book closes on its first spread.
    if (!isOpen && curRef.current !== 0) {
      flipAnim.current?.stop()
      setFlip(null)
      setCur(0)
    }
  })
  // After every render too: re-mounted pages start hidden until styled.
  useLayoutEffect(() => {
    update(progress.get())
  })

  // ── Leaf being turned ──────────────────────────────────────────────────
  // Darkest when the leaf stands on edge, gone as it lies flat.
  const shade = useTransform(leafRot, (r: number) => Math.sin((Math.abs(r) * Math.PI) / 180))
  const leafOpacity = useTransform(leafRot, (r: number) =>
    spread ? 1 : 1 - seg(Math.abs(r), [100, 172])
  )

  if (!g) return null

  const W = g.page.w
  const H = g.page.h
  const folio = (p: PageSpec) => book.pages.indexOf(p) + 1
  const sheet = (p: PageSpec, side: Side, interactive: boolean, shading?: MotionValue<number>) => (
    <Paper side={side} stock={p.kind === 'inside' ? 'board' : 'page'} shade={shading}>
      <PageContent
        spec={p}
        book={book}
        folio={folio(p)}
        lang={lang}
        onGo={interactive ? goSection : undefined}
      />
    </Paper>
  )
  const box = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h })

  // What lies flat under the turning leaf.
  let baseLeft: PageSpec | null = null
  let baseRight: PageSpec
  let leafFront: PageSpec | null = null
  let leafBack: PageSpec | null = null
  if (spread) {
    const [l, r] = book.spreads[Math.min(cur, book.spreads.length - 1)]
    baseLeft = l
    baseRight = r
    if (flip) {
      const [tl, tr] = book.spreads[flip.to]
      if (flip.dir === 1) {
        baseRight = tr
        leafFront = r
        leafBack = tl
      } else {
        baseLeft = tl
        leafFront = l
        leafBack = tr
      }
    }
  } else {
    const p = book.pages[Math.min(cur, book.pages.length - 1)]
    baseRight = p
    if (flip) {
      if (flip.dir === 1) {
        baseRight = book.pages[flip.to]
        leafFront = p
      } else {
        leafFront = book.pages[flip.to]
      }
      leafBack = { kind: 'blank' }
    }
  }
  // Forward (and every turn on phones) the leaf lifts off the right page,
  // hinged on its left edge; back, off the left page, hinged on its right.
  const leafOnRight = !spread || flip?.dir === 1

  // Active chapter (the one being turned to, during a turn).
  const at = flip?.to ?? cur
  const activeSection = spread
    ? (pageSection(book.spreads[at][0]) ?? pageSection(book.spreads[at][1]))
    : pageSection(book.pages[at])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(cur + 1)
    if (e.key === 'ArrowLeft') go(cur - 1)
  }

  const tabH = Math.min(H * 0.17, 128)
  // The book around the pages, in CSS: a light gold board cut at the spine
  // (each half shows and hides on its own), and a thin stack of pages along
  // each outer edge.
  const shift = spread ? 0 : g.k * BOOK.split
  const boardHalf = (side: Side): CSSProperties => {
    const from = side === 'left' ? 0 : g.k * BOOK.split
    const to = side === 'left' ? g.split : g.k * BOOK.w
    const spine = side === 'left' ? 'left' : 'right'
    return {
      left: from - shift,
      top: 0,
      width: to - from,
      height: g.book.h,
      borderRadius: side === 'left' ? '1em 0 0 1em' : '0 1em 1em 0',
      background:
        `linear-gradient(to ${spine}, rgba(150, 110, 45, 0.28) 0%, rgba(150, 110, 45, 0) 3%), ` +
        'linear-gradient(170deg, #F2E3BE 0%, #E9D3A1 55%, #E3C892 100%)',
      boxShadow:
        'inset 0 0 0 1px rgba(176, 136, 66, 0.35), 0 22px 40px -22px rgba(110, 78, 30, 0.45)',
    }
  }
  const stack = (side: Side, r: Rect): CSSProperties => {
    const d = side === 'left' ? -1 : 1
    const u = Math.min(1, g.k * 1.4)
    const lines = ['#E9DEC9', '#FBF6EC', '#E3D6BD', '#F8F2E6', '#DDCDB0']
    return {
      ...box(r),
      borderRadius: pageRadius(side),
      background: '#F6EEE0',
      boxShadow: lines
        .map(
          (c, i) =>
            `${(d * (i + 1) * 1.4 * u).toFixed(1)}px ${((i + 1) * 0.5 * u).toFixed(1)}px 0 ${c}`
        )
        .join(', '),
    }
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-40"
      style={{ visibility: 'hidden' }}
    >
      {/* Golden haze behind the book. */}
      <div
        ref={hazeRef}
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: 0,
          background:
            'radial-gradient(60% 55% at 50% 55%, rgba(246, 214, 160, 0.55) 0%, rgba(246, 214, 160, 0.18) 45%, rgba(246, 214, 160, 0) 75%)',
        }}
      />

      <div
        ref={bookRef}
        role="region"
        aria-label={t('city.passport.bookLabel')}
        tabIndex={opened ? 0 : -1}
        onKeyDown={onKey}
        className={`absolute outline-none ${opened ? 'pointer-events-auto' : ''}`}
        style={{
          left: g.book.x,
          top: g.book.y,
          width: g.book.w,
          height: g.book.h,
          // Mild, so a turning leaf or the cover barely grows past the book.
          perspective: W * 14,
          fontSize: g.fontSize,
        }}
      >
        {/* Tabs + page controls: only once the book is open. */}
        <div ref={chromeRef} style={{ opacity: 0 }}>
          <nav aria-label={t('city.passport.tabsLabel')}>
            {SECTIONS.map((s, i) => {
              const active = s === activeSection
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => goSection(s)}
                  aria-current={active ? 'true' : undefined}
                  className="font-sans absolute flex items-center justify-center rounded-r-[7px] border transition-transform duration-500 ease-out"
                  style={{
                    left: g.book.w - 10,
                    top: g.right.y + H * 0.07 + i * (tabH + 6),
                    width: TAB_OUT + 10,
                    height: tabH,
                    transform: `translateX(${active ? 0 : -9}px)`,
                    borderColor: `${GOLD}${active ? 'dd' : '88'}`,
                    background: active
                      ? 'linear-gradient(90deg, #EBD9B5 0%, #FAF1DE 45%)'
                      : 'linear-gradient(90deg, #D9C298 0%, #E9D8B6 50%)',
                    color: active ? '#B07A26' : '#7A6450',
                    boxShadow: active ? '2px 2px 6px -2px rgba(92, 60, 24, 0.35)' : undefined,
                  }}
                >
                  <span className="pl-[8px] text-[0.6em] tracking-[0.26em] uppercase [writing-mode:vertical-rl]">
                    {t(`city.passport.sections.${s}.tab`)}
                  </span>
                </button>
              )
            })}
          </nav>

          <div
            className="font-sans text-forest absolute inset-x-0 flex items-center justify-center gap-6"
            style={{ top: g.book.h + 8 }}
          >
            <button
              type="button"
              onClick={() => go(cur - 1)}
              disabled={cur === 0}
              aria-label={t('city.passport.prev')}
              className="hover:text-honey p-2 transition-colors disabled:opacity-30"
            >
              <Chevron dir={-1} />
            </button>
            <span className="min-w-[4.5em] text-center text-[0.72em] tracking-[0.3em] tabular-nums">
              {at + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(cur + 1)}
              disabled={cur === count - 1}
              aria-label={t('city.passport.next')}
              className="hover:text-honey p-2 transition-colors disabled:opacity-30"
            >
              <Chevron dir={1} />
            </button>
          </div>
        </div>

        {/* Left half of the open book (spread only): shows as the cover comes down. */}
        {spread && (
          <div ref={leftHalfRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
            <div className="pointer-events-none absolute" style={boardHalf('left')} />
            <div className="pointer-events-none absolute" style={stack('left', g.left)} />
            {baseLeft && (
              <div ref={leftRef} className="absolute" style={box(g.left)}>
                {sheet(baseLeft, 'left', opened && !flip)}
              </div>
            )}
          </div>
        )}

        {/* Right half: lies under the closed cover — its board edge and page
            stack are the closed book's thickness. */}
        <div ref={baseRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
          <div className="pointer-events-none absolute" style={boardHalf('right')} />
          <div className="pointer-events-none absolute" style={stack('right', g.right)} />
          <div className="absolute" style={box(g.right)}>
            {sheet(baseRight, 'right', opened && !flip)}
          </div>
        </div>

        {/* The leaf turning (click navigation): the very same sheets. */}
        {flip && leafFront && leafBack && (
          <motion.div
            className="absolute"
            style={{
              ...box(leafOnRight ? g.right : g.left),
              rotateY: leafRot,
              opacity: leafOpacity,
              transformOrigin: leafOnRight ? 'left center' : 'right center',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="absolute inset-0" style={hidden3d}>
              {sheet(leafFront, leafOnRight ? 'right' : 'left', false, shade)}
            </div>
            <div className="absolute inset-0" style={{ ...hidden3d, transform: 'rotateY(180deg)' }}>
              {sheet(leafBack, leafOnRight ? 'left' : 'right', false, shade)}
            </div>
          </motion.div>
        )}

        {/* The cover: scroll-driven, over the right page, hinged on its left edge. */}
        <div
          ref={coverRef}
          className="absolute"
          style={{
            ...box(g.right),
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="absolute inset-0" style={hidden3d}>
            <PassportCover
              g={g}
              boardRef={boardRef}
              vignetteRef={vignetteRef}
              titleRef={titleRef}
            />
          </div>
          <div className="absolute inset-0" style={{ ...hidden3d, transform: 'rotateY(180deg)' }}>
            <Paper side="left" stock="board" />
          </div>
        </div>
      </div>

      {/* Off-screen copy of an entries page, measured to paginate. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-0"
        style={{ width: W, height: H, fontSize: g.fontSize, visibility: 'hidden' }}
      >
        <EntriesFrame section="tourism" listRef={listMeasureRef}>
          <div ref={itemsMeasureRef} className="absolute inset-x-0 top-0">
            {SECTIONS.map((s) =>
              sectionEntries(s, lang).map((e, i) => (
                <div key={`${s}-${i}`} data-sec={s}>
                  <EntryItem entry={e} />
                </div>
              ))
            )}
          </div>
        </EntriesFrame>
      </div>
    </div>
  )
}

function Chevron({ dir }: { dir: 1 | -1 }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        d={dir === 1 ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
