import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type Variants,
} from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../content.config'
import type { Gift } from '../../types'
import { NAV_HEIGHT } from '../sections/Envelope'
import { DeskFlowers } from '../sections/passport/DeskFlowers'
import { deskLayout, isDesk, isHand, passportGeometry } from '../sections/passport/geometry'
import { ScrollHint } from '../ui/ScrollHint'

/** A polaroid's height over its width (picture 4:5 plus the strip under it). */
export const CARD_ASPECT = 6.3 / 4

// The section's own scroll, in screens. It pins with the title already in
// the middle of the desk (the RSVP drew it there as its reply card left);
// over RISE_VH the title rises to the top and the first page comes in
// under it; then every PAGE_VH of scroll brings the next page of gifts; a
// short stay on the last one, then the page goes on.
const RISE_VH = 0.7
const LIST_VH = 0.55
const PAGE_VH = 0.8
const TAIL_VH = 0.4

interface Chapter {
  id: string
  title: string
  tab: string
  gifts: Gift[]
}

interface Page {
  chapter: number
  gifts: Gift[]
  /** Index of the first gift on this page in the whole list. */
  first: number
}

interface Props {
  gifts: Gift[]
  /** Renders one gift's polaroid at the given width. */
  renderCard: (gift: Gift, index: number, width: number) => ReactNode
}

/** The gifts grouped in CONFIG.giftCategories' order. */
export function useChapters(gifts: Gift[]): Chapter[] {
  const { i18n } = useTranslation()
  const pt = i18n.language === 'pt'
  return useMemo(
    () =>
      CONFIG.giftCategories
        .map((c) => ({
          id: c.id,
          title: pt ? c.title_pt : c.title_en,
          tab: pt ? c.tab_pt : c.tab_en,
          gifts: gifts.filter((g) => g.category === c.id),
        }))
        .filter((c) => c.gifts.length > 0),
    [gifts, pt]
  )
}

function useScreen() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

/** How many polaroids fit on one screen, and how wide each is. */
function grid(w: number, h: number) {
  const phone = w < 640
  const cols = w >= 1024 ? 4 : phone ? 2 : 3
  const rows = 2
  const gapX = w >= 1024 ? 36 : 14
  const gapY = phone ? 18 : 28
  // The chapter tabs stand in a column a little left of the polaroids
  // (which stay centred on the screen): names on a wide screen, a narrow
  // strip of upright labels (as the passport's) on a phone.
  const tabsW = phone ? 30 : 200
  // Room left for the grid: under the nav, the label and the title; over
  // the hint at the foot.
  const top = NAV_HEIGHT + (phone ? 112 : 128)
  const bottom = phone ? 56 : 66
  const byHeight = (h - top - bottom - gapY * (rows - 1)) / rows / CARD_ASPECT
  // The polaroids are centred, so the tabs' room is kept on both sides.
  const byWidth = (Math.min(w - 2 * tabsW - (phone ? 28 : 160), 1000) - gapX * (cols - 1)) / cols
  const cardW = Math.max(100, Math.min(byHeight, byWidth, 240))
  return { cols, rows, gapX, gapY, cardW, top, bottom, phone, tabsW }
}

/** Splits each chapter into pages of at most `per`, as evenly as possible. */
function paginate(chapters: Chapter[], per: number): Page[] {
  const pages: Page[] = []
  let first = 0
  chapters.forEach((chapter, ci) => {
    const n = chapter.gifts.length
    const size = Math.ceil(n / Math.ceil(n / per))
    for (let i = 0; i < n; i += size) {
      pages.push({ chapter: ci, gifts: chapter.gifts.slice(i, i + size), first: first + i })
    }
    first += n
  })
  return pages
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ramp = (v: number, [a, b]: number[]) => clamp01((v - a) / (b - a))
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/** Where the list's title sits: in the middle of the screen, then at the top. */
export function giftsTitleLayout(w: number, h: number) {
  const phone = w < 640
  return {
    midY: h / 2 - 10,
    topY: NAV_HEIGHT + (phone ? 74 : 84),
    // From the large title to the list's heading size.
    endScale: phone ? 0.71 : 0.67,
  }
}

/**
 * The list's kicker and title, centred on the desk. Drawn by the RSVP as its
 * reply card leaves and, in the very same place, by the list as it pins, so
 * the hand-over between the two can't be seen. The list then moves the
 * title up (y, scale).
 */
export function GiftsTitle({
  opacity = 1,
  y,
  scale = 1,
  hidden,
}: {
  opacity?: number | MotionValue<number>
  y?: MotionValue<number>
  scale?: number | MotionValue<number>
  hidden?: boolean
}) {
  const { t } = useTranslation()
  const { w, h } = useScreen()
  const L = giftsTitleLayout(w, h)
  return (
    <motion.div
      aria-hidden={hidden}
      className="pointer-events-none absolute inset-0"
      style={{ opacity }}
    >
      <p
        className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
        style={{ top: NAV_HEIGHT + 32 }}
      >
        {t('nav.gifts')}
      </p>
      <motion.div className="absolute inset-x-0 top-0 h-0" style={{ y: y ?? L.midY, scale }}>
        <h2 className="font-display text-title -translate-y-1/2 px-4 text-center text-4xl leading-[1.35] md:text-5xl">
          {t('gifts.title')}
        </h2>
      </motion.div>
    </motion.div>
  )
}

/**
 * The gift list on the invitation's desk. It lies over the end of the RSVP
 * section and takes the screen as it pins — the same paper, the same
 * wildflowers, the reply card just gone — so there is no seam. The scroll
 * then turns the pages of gifts, the polaroids always coming in rising; the
 * chapter tabs at the left show where the list is and jump to a chapter.
 */
export function GiftChapters({ gifts, renderCard }: Props) {
  const { t } = useTranslation()
  const chapters = useChapters(gifts)
  const { w, h } = useScreen()
  const { cols, rows, gapX, gapY, cardW, top, bottom, phone, tabsW } = grid(w, h)
  const pages = useMemo(() => paginate(chapters, cols * rows), [chapters, cols, rows])
  // The desk's wildflowers, where the RSVP left them (not on a phone, where
  // the passport and the invitation are held in the hand).
  const deskGeo = useMemo(
    () => (isDesk(w, h) && !isHand(w, h) ? passportGeometry(w, h) : null),
    [w, h]
  )

  const sectionRef = useRef<HTMLDivElement>(null)
  const heightVh = 1 + RISE_VH + pages.length * PAGE_VH + TAIL_VH
  // Unseen until it pins (the RSVP shows meanwhile), as the RSVP over the
  // passport's stage.
  const { scrollYProgress: arrival } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  })
  const sectionOpacity = useTransform(arrival, (v) => (v >= 0.999 ? 1 : 0))
  const sectionEvents = useTransform(arrival, (v) => (v >= 0.999 ? 'auto' : 'none'))

  // How far the section has scrolled under its pin, in screens.
  const { scrollY } = useScroll()
  const into = useTransform(scrollY, () => {
    const el = sectionRef.current
    return el ? -el.getBoundingClientRect().top / window.innerHeight : 0
  })

  const L = giftsTitleLayout(w, h)
  const rise = useTransform(into, (v) => easeInOut(clamp01(v / RISE_VH)))
  const titleY = useTransform(rise, (r) => L.midY + (L.topY - L.midY) * r)
  const titleScale = useTransform(rise, (r) => 1 + (L.endScale - 1) * r)
  const tabsOpacity = useTransform(into, (v) => ramp(v, [RISE_VH - 0.2, RISE_VH]))

  const [shown, setShown] = useState(false)
  const [at, setAt] = useState(0)
  useMotionValueEvent(into, 'change', (v) => {
    setShown(v >= LIST_VH)
    const page = Math.floor((v - RISE_VH) / PAGE_VH)
    setAt(Math.max(0, Math.min(pages.length - 1, page)))
  })
  const page = pages[Math.min(at, pages.length - 1)]
  /** Scrolls to a chapter's first page. */
  const goChapter = (ci: number) => {
    const el = sectionRef.current
    const to = pages.findIndex((pg) => pg.chapter === ci)
    if (!el || to < 0) return
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: top + (RISE_VH + (to + 0.3) * PAGE_VH) * window.innerHeight,
      behavior: 'smooth',
    })
  }
  // The polaroids' block, centred on the screen; the tabs stand just left
  // of its widest page, so they keep their place as the pages change.
  const widest = Math.max(
    1,
    ...pages.map((pg) => Math.min(cols, Math.ceil(pg.gifts.length / rows)))
  )
  const blockW = widest * (cardW + gapX) - gapX

  return (
    <motion.div
      ref={sectionRef}
      className="relative"
      style={{
        height: `${heightVh * 100}vh`,
        opacity: sectionOpacity,
        pointerEvents: sectionEvents,
      }}
    >
      {/* The nav's "Presentes" lands here: the list lying on the desk. */}
      <div
        id="gifts-list"
        className="absolute inset-x-0"
        style={{ top: `${(RISE_VH + 0.1) * 100}vh` }}
      />
      <div className="bg-peach bg-paper sticky top-0 h-[100svh] overflow-hidden">
        {deskGeo && <DeskFlowers g={deskGeo} desk={deskLayout(deskGeo)} />}

        <GiftsTitle y={titleY} scale={titleScale} />

        <div className="absolute inset-x-0" style={{ top, bottom }}>
          {/* The chapter tabs, a column a little left of the polaroids. */}
          <motion.div
            role="tablist"
            aria-orientation="vertical"
            aria-label={t('gifts.chapters')}
            className="absolute top-1/2 flex -translate-y-1/2 flex-col"
            style={{
              width: tabsW,
              left: phone ? 6 : `max(16px, calc(50% - ${blockW / 2 + tabsW + 40}px))`,
              opacity: tabsOpacity,
            }}
          >
            {chapters.map((c, ci) => {
              const active = page?.chapter === ci
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={shown ? 0 : -1}
                  onClick={() => goChapter(ci)}
                  className={`font-sans border-l text-left uppercase transition-colors ${
                    phone
                      ? 'px-2 py-3 text-[0.55rem] tracking-[0.2em] whitespace-nowrap [writing-mode:vertical-rl] rotate-180'
                      : 'py-3 pl-4 text-[0.65rem] tracking-[0.28em]'
                  } ${
                    active
                      ? 'text-title border-amber-deep'
                      : 'text-title/55 hover:text-title border-title/15'
                  }`}
                >
                  {phone ? c.tab : c.title}
                </button>
              )
            })}
          </motion.div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {shown && page && (
                // As few columns as fill the rows evenly (5 lie 3 + 2), the
                // shorter row centred under the fuller one.
                <motion.div
                  key={at}
                  role="tabpanel"
                  aria-label={chapters[page.chapter].title}
                  className="pointer-events-auto flex shrink-0 flex-wrap content-center justify-center"
                  style={{
                    width:
                      Math.min(cols, Math.ceil(page.gifts.length / rows)) * (cardW + gapX) - gapX,
                    columnGap: gapX,
                    rowGap: gapY,
                  }}
                >
                  {page.gifts.map((g, i) => (
                    <motion.div
                      key={g.giftId}
                      style={{ width: cardW }}
                      variants={DEAL}
                      initial="enter"
                      animate="rest"
                      exit="leave"
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                    >
                      {renderCard(g, page.first + i, cardW)}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute inset-x-0 text-center" style={{ bottom: phone ? 18 : 26 }}>
          <ScrollHint
            label={
              shown && at === pages.length - 1 ? t('gifts.scrollToEnd') : t('gifts.scrollToBrowse')
            }
          />
        </div>
      </div>
    </motion.div>
  )
}

// The polaroids always rise: they come up from a little below and settle;
// the leaving ones carry on up as they fade.
const DEAL: Variants = {
  enter: { opacity: 0, y: 48, scale: 0.98 },
  rest: { opacity: 1, y: 0, scale: 1 },
  leave: {
    opacity: 0,
    y: -24,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as const },
  },
}

/**
 * The same chapters laid out as a plain page, for reduced motion: each
 * chapter's title over its polaroids, nothing pinned.
 */
export function GiftChaptersStatic({ gifts, renderCard }: Props) {
  const chapters = useChapters(gifts)
  // Each chapter's first gift's index in the whole list.
  const starts = chapters.map((_, i) =>
    chapters.slice(0, i).reduce((n, c) => n + c.gifts.length, 0)
  )
  return (
    <div className="space-y-20">
      {chapters.map((c, ci) => (
        <div key={c.id}>
          <h3 className="font-display text-title mb-10 text-center text-[1.6rem] md:text-[2rem]">
            {c.title}
          </h3>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {c.gifts.map((g, i) => (
              <div key={g.giftId} className="mx-auto w-full max-w-[16rem]">
                {renderCard(g, starts[ci] + i, 256)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
