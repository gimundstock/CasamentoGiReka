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
import { useMotionValueEvent, type MotionValue } from 'framer-motion'
import { MASK } from './assets'
import { buildBook, pageSection, sectionEntries, SECTIONS, type Chunks } from './content'
import type { PageSpec, SectionKey } from './content'
import {
  carryAt,
  DESK,
  deskLayout,
  NO_CARRY,
  liftAt,
  passportTime,
  pushedAt,
  vignetteAt,
  ease,
  PHASE,
  seg,
  swapOpacities,
  TAB_OUT,
  type PassportGeometry,
  type Rect,
} from './geometry'
import { PassportCover } from './PassportCover'
import { DeskFlowers } from './DeskFlowers'
import { BREATH_MS, NAV_HEIGHT, ShutEnvelope, useClockDelay } from '../Envelope'
import { FlipBook, type FlipBookHandle } from './FlipBook'
import {
  BackBoard,
  BACK_CORNER,
  BOARD_CORNER,
  InsideBoard,
  EntriesFrame,
  EntryItem,
  TAB_PAPER,
  paperFor,
  PageContent,
  Paper,
  PageStack,
  type Side,
} from './Pages'

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

/** How long one page takes to turn, ms. Slow, like a real leaf settling. */
const FLIP_MS = 800
const hidden3d: CSSProperties = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
}

/**
 * The city guide as a passport — the second half of HeroBigDay's sticky stage.
 *
 * Scroll-driven until it is open (`progress` is vh of scroll past the big
 * day, see PHASE): the cover grows around the painting HeroBigDay has shrunk
 * into its blot, then turns over to the left, a rigid board. From there it
 * is a book you click through: tabs on the right edge jump to a chapter,
 * arrows and the keyboard turn one page, and the pages themselves can be
 * dragged by a corner — soft paper that curls (FlipBook / StPageFlip).
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
  holder,
}: {
  progress: MotionValue<number>
  g: PassportGeometry | null
  reduced: boolean
  /** Whose passport it is (the guest's group name), if known. */
  holder?: string
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
  // Phones: a notebook folded back on itself, one page at a time — so no
  // inside of the cover, and no palm filling a chapter's empty page.
  const notes = useMemo(
    () => book.pages.filter((p) => p.kind !== 'inside' && p.kind !== 'buriti'),
    [book]
  )
  // What the book holds: spreads laid end to end (two pages each), or the
  // notebook's pages.
  const leaves = useMemo(() => (spread ? book.spreads.flat() : notes), [book, notes, spread])
  const count = spread ? book.spreads.length : notes.length

  // ── Click navigation ───────────────────────────────────────────────────
  const [opened, setOpened] = useState(false)
  const [cur, setCur] = useState(0)
  // Where the book is going: `cur` as soon as a turn starts (the tabs move
  // with the leaf, not after it lands).
  const [aim, setAim] = useState(0)
  // Has the guest turned a page yet? Until then, the hint says how.
  const [browsed, setBrowsed] = useState(false)
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const flipRef = useRef<FlipBookHandle>(null)

  // A new layout, language or pagination is a new book: start it over.
  const layoutKey = `${spread}-${lang}-${leaves.length}-${g?.page.w}x${g?.page.h}`
  const [seenLayout, setSeenLayout] = useState(layoutKey)
  if (seenLayout !== layoutKey) {
    setSeenLayout(layoutKey)
    setCur(0)
    setAim(0)
  }

  const go = useCallback(
    (to: number) => {
      const fb = flipRef.current
      if (!fb || fb.busy() || to === cur || to < 0 || to >= count) return
      const page = spread ? to * 2 : to
      setBrowsed(true)
      setAim(to)
      if (reduced) fb.turnTo(page)
      else fb.flip(page)
    },
    [cur, count, spread, reduced]
  )
  const onFlip = useCallback(
    (page: number) => {
      const at = spread ? Math.floor(page / 2) : page
      setCur(at)
      setAim(at)
      if (at !== 0) setBrowsed(true)
    },
    [spread]
  )
  const onTurn = useCallback(
    (page: number) => setAim(spread ? Math.floor(page / 2) : page),
    [spread]
  )
  const goSection = (s: SectionKey) =>
    go(spread ? book.firstSpread[s] : notes.findIndex((p) => pageSection(p) === s))

  // ── Scroll-driven part ─────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const vignetteRef = useRef<HTMLDivElement>(null)
  const cathedralRef = useRef<HTMLImageElement>(null)
  const riseRef = useRef<HTMLDivElement>(null)
  const blotRef = useRef<HTMLDivElement>(null)
  const paintRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const insideRef = useRef<HTMLDivElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLElement>(null)
  const hazeRef = useRef<HTMLDivElement>(null)
  const shutHintRef = useRef<HTMLDivElement>(null)
  const leavesRef = useRef<HTMLDivElement>(null)
  // The desk (wide screens, see DESK): the book's carrier, and the envelope
  // with its words and the invitation's paper.
  const deskRef = useRef<HTMLDivElement>(null)
  const envRef = useRef<HTMLDivElement>(null)
  const envWordsRef = useRef<HTMLDivElement>(null)
  const envHintRef = useRef<HTMLDivElement>(null)
  const envPaperRef = useRef<HTMLDivElement>(null)
  const flowersRef = useRef<HTMLDivElement>(null)
  const desk = !!g?.desk && !reduced
  const layout = useMemo(() => (g && desk ? deskLayout(g) : null), [g, desk])
  const breathDelay = useClockDelay(BREATH_MS)

  const update = useCallback(
    (at: number) => {
      const root = rootRef.current
      const bookEl = bookRef.current
      const cover = coverRef.current
      const board = boardRef.current
      const title = titleRef.current
      const base = baseRef.current
      const chrome = chromeRef.current
      const haze = hazeRef.current
      if (!g || !root || !bookEl || !cover || !board || !title || !base || !chrome || !haze) return
      // The passport's own time: still while it lies on the desk.
      const v = passportTime(at, desk)
      // The desk: how far the passport lies on it (0 → 1 → 0), and what
      // carries it there.
      const lying = layout ? ease(seg(at, DESK.back)) - ease(seg(at, DESK.pickUp)) : 0
      const carry = layout ? carryAt(layout, lying) : NO_CARRY
      const inside = insideRef.current
      const vignette = vignetteRef.current
      // Boards from the cover's corner (shut) to the board art's own (open);
      // the pages concentric inside them.
      /** One page edge in the open book's page block, px. */
      const hairline = Math.max(1, 1.6 * g.k)
      const setRadii = (o: number) => {
        const lerp = (to: number) => g.radius + (to - g.radius) * o
        const w = g.coverBox.w
        bookEl.style.setProperty('--board-r', `${lerp(w * BOARD_CORNER).toFixed(2)}px`)
        bookEl.style.setProperty('--back-r', `${lerp(w * BACK_CORNER).toFixed(2)}px`)
        // Pages concentric with the board they lie on (left / right).
        bookEl.style.setProperty(
          '--page-r',
          `${(lerp(w * BOARD_CORNER) - g.overhang).toFixed(2)}px`
        )
        bookEl.style.setProperty(
          '--page-rr',
          `${(lerp(w * BACK_CORNER) - g.overhang).toFixed(2)}px`
        )
      }
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
        bookEl.style.setProperty('--bd', '0px')
        bookEl.style.setProperty('--open', '1')
        setRadii(1)
        bookEl.style.setProperty('--ls', `${hairline.toFixed(2)}px`)
        show(inside, 1)
        chrome.style.opacity = '1'
        if (tabsRef.current) tabsRef.current.style.opacity = '1'
        if (shutHintRef.current) shutHintRef.current.style.opacity = '0'
        haze.style.opacity = '1'
        return o > 0.5
      }

      // Drawn, all but transparent, a little before the swap (see PHASE.warm).
      root.style.visibility = v >= PHASE.warm ? 'visible' : 'hidden'
      root.style.opacity = String(Math.max(0.01, swapOpacities(v).cover))
      // The painting, from the swap on (see vignetteAt).
      if (vignette) {
        const vs = vignetteAt(g, v, carry)
        const st = vignette.style
        st.clipPath = vs.clip
        st.setProperty('-webkit-clip-path', vs.clip)
        const setMask = (el: HTMLElement | null, image: string, sized: boolean) => {
          if (!el || el.dataset.mask === image) return
          el.dataset.mask = image
          el.style.setProperty('mask-image', image)
          el.style.setProperty('-webkit-mask-image', image)
          el.style.setProperty('mask-repeat', 'no-repeat')
          el.style.setProperty('-webkit-mask-repeat', 'no-repeat')
          if (sized) {
            el.style.setProperty('mask-size', '100% 100%')
            el.style.setProperty('-webkit-mask-size', '100% 100%')
          }
        }
        // The blot window: a static mask; only its scale changes.
        setMask(blotRef.current, MASK.blot.image, true)
        if (blotRef.current) blotRef.current.style.transform = vs.window
        if (paintRef.current) paintRef.current.style.transform = vs.paint
        // The rise shape, during the bleed.
        const rise = riseRef.current
        setMask(rise, MASK.rise.image, false)
        if (rise) {
          rise.style.setProperty('mask-size', vs.rise.size)
          rise.style.setProperty('-webkit-mask-size', vs.rise.size)
          rise.style.setProperty('mask-position', vs.rise.position)
          rise.style.setProperty('-webkit-mask-position', vs.rise.position)
        }
      }
      if (cathedralRef.current) {
        cathedralRef.current.style.opacity = String(0.94 * ease(seg(v, PHASE.cathedral)))
      }
      // The cover fades in behind the painting, whole: never a cream edge
      // drawn across the art.
      const grow = ease(seg(v, PHASE.coverGrow))
      // (Opaque before the book beneath it shows, or the first page would
      // show through it.)
      board.style.opacity = String(Math.min(1, grow / 0.8))
      board.style.visibility = grow > 0 ? 'inherit' : 'hidden'

      const tt = ease(seg(v, PHASE.title))
      title.style.opacity = String(tt)
      title.style.transform = `translate3d(0, ${((1 - tt) * 8).toFixed(1)}px, 0)`

      // Open — and, on the desk, closed again once read.
      const closing = desk ? ease(seg(v, DESK.close)) : 0
      const o = ease(seg(v, PHASE.open)) * (1 - closing)
      // Shut: centred, and lifted so the blot stays at the screen's centre.
      bookEl.style.transform = `translate3d(${(g.closedShift * (1 - o)).toFixed(1)}px, ${liftAt(g, v).toFixed(2)}px, 0)`
      cover.style.transform = `rotateY(${(-180 * o).toFixed(2)}deg)`
      // Explicitly hidden before the swap too: a child set 'visible' would
      // otherwise show through the root's 'hidden'.
      cover.style.visibility = v >= PHASE.warm && o < 1 ? 'visible' : 'hidden'
      // Which face shows is chosen here, not left to backface-visibility:
      // WebKit draws a hidden backface's composited children anyway.
      if (frontRef.current) frontRef.current.style.visibility = o < 0.5 ? 'inherit' : 'hidden'
      if (backRef.current) backRef.current.style.visibility = o >= 0.5 ? 'inherit' : 'hidden'
      // One page at a time: the turned cover would hang off the left edge.
      cover.style.opacity = spread ? '1' : String(1 - seg(o, [0.4, 0.9]))
      // Under the cover: the back board and the page block, which appear as
      // the cover finishes growing. Nothing exists left of the spine until
      // the cover has turned: open, the inside of the cover lies there.
      show(base, seg(grow, [0.82, 1]))
      // Shut, the back board and the page block peek a few px past the
      // cover; open, the board is flush with its mirror on the left.
      const boardD = Math.max(3, 5 * g.k) * (1 - o)
      bookEl.style.setProperty('--bd', `${boardD.toFixed(2)}px`)
      bookEl.style.setProperty('--open', o.toFixed(3))
      // Shut, the page block fills out to just past the cover's edge (only
      // that sliver shows); open, it is a few hairline page edges.
      const shutStep = (g.overhang + boardD * 0.55) / 4
      bookEl.style.setProperty('--ls', `${(shutStep + (hairline - shutStep) * o).toFixed(2)}px`)
      // Shut, the layers under the cover round at the spine with the cover
      // (so only a sliver following its curve shows at the bottom); open,
      // they square off to meet their mirror at the spine.
      bookEl.style.setProperty('--sr', `${(g.radius * (1 - o)).toFixed(2)}px`)
      setRadii(o)
      // The pages too, at the spine, where they meet the cover's edge. (On
      // phones that is the notebook's fold: open, it runs straight down.)
      bookEl.style.setProperty('--spine-r', `${Math.max(2, g.radius * (1 - o)).toFixed(2)}px`)
      show(inside, o >= 1 ? 1 : 0)
      // Shut or turning, the pages left of the spine are on the cover (its
      // inside face carries the open page there): none lie left of it. (Set
      // on every layout: a window narrowed to one page must not keep it.)
      const leavesEl = leavesRef.current
      if (leavesEl) {
        const clip = !spread || o >= 1 ? 'none' : `inset(0 0 0 ${g.right.x.toFixed(1)}px)`
        leavesEl.style.clipPath = clip
        leavesEl.style.setProperty('-webkit-clip-path', clip)
      }
      chrome.style.opacity = String(seg(v, [PHASE.open[1] - 25, PHASE.open[1]]) * (1 - closing))
      if (tabsRef.current) tabsRef.current.style.opacity = chrome.style.opacity
      // "Scroll to open", under the finished cover until it starts to turn.
      if (shutHintRef.current) {
        shutHintRef.current.style.opacity = String(
          ease(seg(v, [PHASE.title[1] - 5, PHASE.title[1] + 15])) *
            (1 - seg(v, [PHASE.open[0], PHASE.open[0] + 20]))
        )
      }
      // At the end the envelope is drawn in from the right and pushes the
      // shut passport off to the left, as a hand would, sliding it over.
      const push = layout ? seg(v, DESK.arrive) : 0
      const drawn = ease(push)
      const gone = drawn
      haze.style.opacity = String(grow * (1 - 0.5 * lying) * (1 - gone))
      if (shutHintRef.current && lying > 0) {
        shutHintRef.current.style.opacity = String(
          Number(shutHintRef.current.style.opacity) * (1 - lying)
        )
      }
      // Where the envelope is (centre from the screen's, px) as it's drawn in.
      const envX = layout ? layout.pushFrom * (1 - drawn) : 0
      const carrier = deskRef.current
      if (carrier) {
        carrier.style.zIndex = '1'
        if (!layout || (lying <= 0 && push <= 0)) {
          carrier.style.transform = 'none'
          carrier.style.visibility = 'inherit'
        } else {
          // Pushed by the envelope's edge, then sliding on (pushPath); it
          // turns a little as it goes.
          const shove = pushedAt(layout.pushed, seg(v, DESK.shove))
          const away = Math.min(1, -shove / (g.vw / 2))
          const dx = carry.d.x + shove
          const dy = carry.d.y + g.vh * 0.03 * away
          const rot = carry.rot - 9 * away
          const sc = carry.s
          carrier.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(5)})`
          carrier.style.visibility = seg(v, DESK.shove) >= 1 ? 'hidden' : 'inherit'
        }
      }
      // The envelope fades in where it lies, with the cover (one thing, the
      // two of them); it slides out as the passport is picked up, and is
      // drawn back in at the end, to the invitation's own place — on top of
      // the passport, which it pushes away.
      // (In step with the whole cover: board, bleed and title, done together.)
      const coverIn = ease(seg(v, [PHASE.coverGrow[0], PHASE.title[1]]))
      const envEl = envRef.current
      if (envEl && layout) {
        const { envelope: E, closed: F, offRight } = layout
        const go = ease(seg(at, DESK.pickUp))
        let x: number, y: number, rot: number, sc: number
        if (push > 0) {
          x = envX
          y = F.y
          rot = 5 * (1 - drawn)
          sc = 1
        } else {
          x = E.x + (offRight - E.x) * go
          y = E.y
          rot = E.rot
          sc = E.s
        }
        // Drawn, all but transparent, before it shows (as the cover is: a
        // first-shown layer can come up blank for a frame in Safari).
        const seen = push > 0 || (at >= PHASE.warm && go < 1)
        envEl.style.visibility = seen ? 'inherit' : 'hidden'
        envEl.style.opacity = push > 0 ? '1' : String(Math.max(0.01, coverIn))
        envEl.style.zIndex = push > 0 ? '2' : '0'
        envEl.style.transform =
          push >= 1
            ? `translateY(${F.y}px)`
            : `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(5)})`
        const words = ease(seg(v, DESK.words))
        for (const el of [envWordsRef.current, envHintRef.current]) {
          if (!el) continue
          el.style.opacity = String(words)
          el.style.visibility = words > 0 ? 'inherit' : 'hidden'
        }
        show(envPaperRef.current, drawn)
        // The wildflowers lying round the two: in with them, and there to
        // stay (the invitation lays the same ones out, where these are).
        show(flowersRef.current, coverIn)
      }
      return o >= 1
    },
    [g, reduced, spread, desk, layout]
  )
  // Scrolled back up (or on, past the book): it closes on the page it was
  // open at, and opens again on it.
  useMotionValueEvent(progress, 'change', (v) => setOpened(update(v) ?? false))
  // After every render too: re-mounted parts start hidden until styled.
  useLayoutEffect(() => {
    update(progress.get())
  })

  if (!g) return null

  const W = g.page.w
  const H = g.page.h
  const folio = (p: PageSpec) => (spread ? book.pages : notes).indexOf(p) + 1
  const box = (r: Rect): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h })
  // One leaf of the flip book. On the first spread, the left "page" is the
  // inside of the cover, drawn underneath: its leaf stays empty.
  const renderLeaf = (i: number) => {
    const p = leaves[i]
    if (!p) return null
    if (p.kind === 'inside') {
      // (Spreads only: phones have no inside of the cover.) The board
      // itself, cropped to the page and lined up exactly with the board
      // beneath — opaque, so a page turning back to the first spread reveals
      // the inside of the cover, not what lay there before. Only once the
      // book is open: shut or opening, the cover itself is what lies there
      // (and nothing may show left of a closed book).
      if (!opened) return null
      return (
        <div className="absolute inset-0 overflow-hidden">
          <InsideBoard
            rect={{
              x: g.insideBox.x - g.left.x,
              y: g.insideBox.y - g.left.y,
              w: g.insideBox.w,
              h: g.insideBox.h,
            }}
          />
        </div>
      )
    }
    const side: Side = spread && i % 2 === 0 ? 'left' : 'right'
    return (
      <Paper side={side} background={paperFor(i, p.kind === 'entries')}>
        <PageContent spec={p} folio={folio(p)} lang={lang} holder={holder} />
      </Paper>
    )
  }

  // Active chapter.
  // (Where the book is going: the tabs move as the leaf starts to turn.)
  const activeSection = spread
    ? (pageSection(book.spreads[aim][0]) ?? pageSection(book.spreads[aim][1]))
    : pageSection(notes[aim])
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(cur + 1)
    if (e.key === 'ArrowLeft') go(cur - 1)
  }

  const tabH = Math.min(H * 0.17, 128)
  // How far the tabs reach in under the pages.
  const TAB_TUCK = 12
  // Thickness of the page block either side: what has been read lies on the
  // left, what is left to read on the right (none on the left at the start).
  const read = count > 1 ? cur / (count - 1) : 0
  const leftLines = spread ? Math.round(read * 4) : 0
  const rightLines = Math.round((1 - read) * 4)
  // Layers under the cover, all with corners concentric with its own: the
  // pages (radius --page-r), the page block (four steps reaching just
  // past the cover's edge) and the back board (a little further).
  // While shut, the back board and the page block peek past the cover
  // (--bd, --ls: set by the scroll, back to flush as the book opens).
  const step = 'var(--ls, 1px)'
  // Room under the page controls for a line of hint, and under the shut
  // cover for "scroll to open".
  const below = g.vh - (g.book.y + g.book.h)
  const shutHintTop = g.book.y + g.coverBox.y + g.coverBox.h + 14
  const insideRect = { x: 0, y: 0, w: g.insideBox.w, h: g.insideBox.h }
  // The left page, where it lies on the inside of the cover.
  const leftOnInside = { ...g.left, x: g.left.x - g.insideBox.x, y: g.left.y - g.insideBox.y }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-40"
      style={{ visibility: 'hidden' }}
    >
      {/* The desk's end: the invitation's paper comes in with its envelope. */}
      {layout && (
        <div
          ref={envPaperRef}
          aria-hidden
          className="bg-peach bg-paper absolute inset-0"
          style={{ opacity: 0, visibility: 'hidden' }}
        />
      )}

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

      {/* Under the shut cover: scroll to open it. */}
      {!reduced && g.vh - shutHintTop >= 28 && (
        <div
          ref={shutHintRef}
          aria-hidden
          className="absolute inset-x-0"
          style={{ top: shutHintTop, opacity: 0, fontSize: g.fontSize }}
        >
          <Hint label={t('city.passport.hintOpen')} down />
        </div>
      )}

      {/* Wildflowers lying round the passport and the envelope. */}
      {layout && (
        <DeskFlowers
          g={g}
          desk={layout}
          divRef={flowersRef}
          style={{ opacity: 0, visibility: 'hidden' }}
        />
      )}

      {/* The desk's envelope: the invitation's own, shut — the same layers,
          size and place where it ends, so the invitation (RSVP) takes over
          unseen. With its kicker above, and its hint below. Under the passport,
          which lies on its edge. */}
      {layout && (
        <>
          <div
            ref={envWordsRef}
            aria-hidden
            className="font-sans text-amber absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
            style={{ top: NAV_HEIGHT + 32, opacity: 0, visibility: 'hidden' }}
          >
            {t('rsvp.kicker')}
          </div>
          <div
            ref={envRef}
            aria-hidden
            className="absolute"
            style={{
              width: layout.env.ew,
              height: layout.env.eh,
              left: '50%',
              top: '50%',
              marginLeft: -layout.env.ew / 2,
              marginTop: -layout.env.eh / 2,
              visibility: 'hidden',
            }}
          >
            <ShutEnvelope orient={layout.env.orient} ew={layout.env.ew} />
            <div
              ref={envHintRef}
              className="font-serif text-title/70 absolute inset-x-0 -bottom-16 text-center text-lg italic"
              style={{ opacity: 0, visibility: 'hidden' }}
            >
              <span className="animate-breath inline-block" style={{ animationDelay: breathDelay }}>
                {t('rsvp.envelopeHint')} ↓
              </span>
            </div>
          </div>
        </>
      )}

      {/* What carries the book across the desk (see DESK): turned about the
          shut cover's centre. */}
      <div
        ref={deskRef}
        className="absolute inset-0"
        style={{
          transformOrigin: layout ? `${layout.C.x}px ${layout.C.y}px` : undefined,
        }}
      >
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
            // Mild, so the turning cover barely grows past the book.
            perspective: W * 14,
            fontSize: g.fontSize,
          }}
        >
          {/* Page controls: only once the book is open. */}
          <div ref={chromeRef} style={{ opacity: 0 }}>
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
                {cur + 1} / {count}
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
            {/* How the book works, until a page has been turned; then (and on
              the last page) that the site goes on below. */}
            {below >= 64 && (
              <div className="absolute inset-x-0" style={{ top: g.book.h + 46 }}>
                {browsed || cur === count - 1 ? (
                  <Hint label={t('city.passport.hintScroll')} down />
                ) : (
                  <Hint label={t(touch ? 'city.passport.hintTouch' : 'city.passport.hintClick')} />
                )}
              </div>
            )}
          </div>

          {/* Open: the inside of the front cover, lying flat left of the spine
            (exactly where the turned cover came down). */}
          {spread && (
            <div ref={insideRef} className="absolute" style={{ ...box(g.insideBox), opacity: 0 }}>
              <InsideBoard rect={insideRect} />
              {leftLines > 0 && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                  <PageStack
                    page={leftOnInside}
                    side="left"
                    lines={leftLines}
                    step={step}
                    r0="var(--page-r)"
                  />
                </div>
              )}
            </div>
          )}

          {/* Under the cover: the back board, the page block, the pages. */}
          <div ref={baseRef} className="absolute inset-0" style={{ visibility: 'hidden' }}>
            <BackBoard rect={g.coverBox} d="var(--bd, 0px)" spineR="var(--sr, 0px)" />
            <PageStack
              page={g.right}
              side="right"
              lines={rightLines}
              step={step}
              r0="var(--page-rr)"
              spineR="var(--sr, 0px)"
            />
            {/* Index tabs: tucked in between the pages (the page block and the
              pages lie over their inner end), on the book's own paper. Only
              once the book is open. */}
            {/* Not on the last stop: the inside back cover is the end, its art
              left clear. */}
            <nav
              ref={tabsRef}
              aria-label={t('city.passport.tabsLabel')}
              style={{ opacity: 0, visibility: spread && cur === count - 1 ? 'hidden' : undefined }}
            >
              {SECTIONS.map((s, i) => {
                const active = s === activeSection
                // The tab is on the chapter's first leaf (its opener, always a
                // left page): once that leaf has turned, the tab has gone over
                // with it to the left edge (two-page spreads only).
                const passed = spread && aim >= book.firstSpread[s]
                const w = TAB_TUCK + (active ? TAB_OUT : TAB_OUT - 8)
                const edge = 'rgba(190, 150, 80, 0.5)'
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => goSection(s)}
                    aria-current={active ? 'true' : undefined}
                    className="font-sans absolute flex items-center justify-center"
                    style={{
                      // Under the pages all the way across, like the leaf it
                      // is on.
                      left: passed ? g.left.x + TAB_TUCK - w : g.right.x + g.right.w - TAB_TUCK,
                      top: g.right.y + H * 0.07 + i * (tabH + 6),
                      width: w,
                      height: tabH,
                      paddingLeft: passed ? 0 : TAB_TUCK,
                      paddingRight: passed ? TAB_TUCK : 0,
                      borderRadius: passed ? '0.6em 0 0 0.6em' : '0 0.6em 0.6em 0',
                      border: `1px solid ${edge}`,
                      borderLeftColor: passed ? edge : 'transparent',
                      borderRightColor: passed ? 'transparent' : edge,
                      background: TAB_PAPER,
                      color: active ? '#B07A26' : '#8A7458',
                      boxShadow: `${passed ? -1 : 1}px 1px 3px -1px rgba(110, 78, 30, 0.28)`,
                      // Read chapters' tabs ride on the cover's inside: gone
                      // while it turns.
                      opacity: passed && !opened ? 0 : 1,
                      transition: `opacity 250ms, left ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.25, 1), padding ${FLIP_MS}ms, border-radius ${FLIP_MS}ms, border-color ${FLIP_MS}ms, box-shadow ${FLIP_MS}ms, width 500ms ease-out, color 500ms ease-out`,
                    }}
                  >
                    <span className="text-[0.6em] tracking-[0.24em] whitespace-nowrap uppercase [writing-mode:vertical-rl]">
                      {t(`city.passport.sections.${s}.tab`)}
                    </span>
                  </button>
                )
              })}
            </nav>
            <div ref={leavesRef} className="pointer-events-none absolute inset-0">
              <FlipBook
                key={layoutKey}
                ref={flipRef}
                width={W}
                height={H}
                portrait={!spread}
                count={leaves.length}
                renderPage={renderLeaf}
                flippingTime={FLIP_MS}
                onFlip={onFlip}
                onTurn={onTurn}
                className="pointer-events-auto absolute"
                style={{ left: spread ? g.left.x : g.right.x, top: g.right.y }}
              />
            </div>
          </div>

          {/* The cover: scroll-driven, a rigid board hinged on its left edge. */}
          <div
            ref={coverRef}
            className="absolute"
            style={{
              ...box(g.coverBox),
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            <div ref={frontRef} className="absolute inset-0" style={hidden3d}>
              <PassportCover
                g={g}
                boardRef={boardRef}
                vignetteRef={vignetteRef}
                riseRef={riseRef}
                blotRef={blotRef}
                paintRef={paintRef}
                cathedralRef={cathedralRef}
                titleRef={titleRef}
              />
            </div>
            <div
              ref={backRef}
              className="absolute inset-0"
              style={{ ...hidden3d, transform: 'rotateY(180deg)', visibility: 'hidden' }}
            >
              <InsideBoard rect={insideRect} />
              {/* Closed part-way through the book: the pages read lie on the
                cover's inside, the open one on top — turning back over, the
                book opens on it again. */}
              {spread && cur !== 0 && (
                <>
                  <PageStack
                    page={leftOnInside}
                    side="left"
                    lines={leftLines}
                    step={step}
                    r0="var(--page-r)"
                  />
                  <div className="absolute" style={box(leftOnInside)}>
                    {renderLeaf(cur * 2)}
                  </div>
                </>
              )}
            </div>
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

/** A small line of guidance, optionally with a chevron nudging downwards. */
function Hint({ label, down }: { label: string; down?: boolean }) {
  return (
    <p className="font-sans flex items-center justify-center gap-[0.6em] text-[0.58em] tracking-[0.28em] text-[#8A7458] uppercase">
      <span>{label}</span>
      {down && (
        <svg viewBox="0 0 24 24" className="animate-nudge h-[1.4em] w-[1.4em]" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </p>
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
