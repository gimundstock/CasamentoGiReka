import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
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

// The section's own scroll, as fractions of it: the title comes onto the
// bare desk, stays a moment, gives way to the list (the polaroids dealt
// from LIST_AT), which then stays until the section lets go.
const INTRO = [0, 0.12]
const SWAP = [0.3, 0.42]
const LIST_AT = 0.36
// Section height, and the scroll it pins for (the height but one screen).
const HEIGHT_VH = 260
const PINNED_VH = HEIGHT_VH - 100

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
  const gapX = w >= 1024 ? 40 : 16
  const gapY = phone ? 20 : 32
  // Room left for the grid: under the nav, the label, the title and the
  // chapter tabs; over the hint at the foot.
  const top = NAV_HEIGHT + (phone ? 132 : 158)
  const bottom = phone ? 56 : 66
  const byHeight = (h - top - bottom - gapY * (rows - 1)) / rows / CARD_ASPECT
  // Room at the sides for the arrows.
  const byWidth = (Math.min(w - (phone ? 72 : 160), 1100) - gapX * (cols - 1)) / cols
  const cardW = Math.max(110, Math.min(byHeight, byWidth, 240))
  return { cols, rows, gapX, gapY, cardW, top, bottom, phone }
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

/**
 * The gift list on the invitation's desk. It lies over the end of the RSVP
 * section and takes the screen as it pins — the same paper, the same
 * wildflowers, the reply card just gone — so there is no seam. The scroll
 * only brings the list onto the desk; from there the guest browses it by
 * hand: the chapter tabs, the arrows beside the polaroids, a swipe.
 */
export function GiftChapters({ gifts, renderCard }: Props) {
  const { t } = useTranslation()
  const chapters = useChapters(gifts)
  const { w, h } = useScreen()
  const { cols, rows, gapX, gapY, cardW, top, bottom, phone } = grid(w, h)
  const pages = useMemo(() => paginate(chapters, cols * rows), [chapters, cols, rows])
  // The desk's wildflowers, where the RSVP left them (not on a phone, where
  // the passport and the invitation are held in the hand).
  const deskGeo = useMemo(
    () => (isDesk(w, h) && !isHand(w, h) ? passportGeometry(w, h) : null),
    [w, h]
  )

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  // Unseen until it pins (the RSVP shows meanwhile), as the RSVP over the
  // passport's stage.
  const { scrollYProgress: arrival } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  })
  const sectionOpacity = useTransform(arrival, (v) => (v >= 0.999 ? 1 : 0.01))
  const sectionEvents = useTransform(arrival, (v) => (v >= 0.999 ? 'auto' : 'none'))

  const kickerOpacity = useTransform(p, (v) => ramp(v, INTRO))
  const introOpacity = useTransform(p, (v) => ramp(v, INTRO) * (1 - ramp(v, SWAP)))
  const introY = useTransform(p, (v) => -ramp(v, SWAP) * 24)
  const headOpacity = useTransform(p, (v) => ramp(v, [SWAP[0] + 0.04, SWAP[1] + 0.04]))

  const [shown, setShown] = useState(false)
  useMotionValueEvent(p, 'change', (v) => setShown(v >= LIST_AT))

  const [at, setAt] = useState(0)
  const [dir, setDir] = useState(1)
  const page = pages[Math.min(at, pages.length - 1)]
  const go = (to: number) => {
    if (to < 0 || to >= pages.length || to === at) return
    setDir(to > at ? 1 : -1)
    setAt(to)
  }
  const goChapter = (ci: number) => go(pages.findIndex((pg) => pg.chapter === ci))

  return (
    <motion.div
      ref={sectionRef}
      className="relative"
      style={{ height: `${HEIGHT_VH}vh`, opacity: sectionOpacity, pointerEvents: sectionEvents }}
    >
      {/* The nav's "Presentes" lands here: the list lying on the desk. */}
      <div
        id="gifts-list"
        className="absolute inset-x-0"
        style={{ top: `${(SWAP[1] + 0.06) * PINNED_VH}vh` }}
      />
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {deskGeo && <DeskFlowers g={deskGeo} desk={deskLayout(deskGeo)} />}

        <motion.p
          className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
          style={{ top: NAV_HEIGHT + 32, opacity: kickerOpacity }}
        >
          {t('nav.gifts')}
        </motion.p>

        {/* First the title and its note, alone on the desk. */}
        <motion.div
          aria-hidden={shown}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ opacity: introOpacity, y: introY }}
        >
          <h2 className="font-display text-title text-4xl md:text-5xl">{t('gifts.title')}</h2>
          <p className="font-serif text-title mx-auto mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
            {t('gifts.subtitle')}
          </p>
        </motion.div>

        {/* Then the list: its title, the chapter tabs, the polaroids. */}
        <motion.div
          className="absolute inset-x-0 px-2 text-center"
          style={{ top: NAV_HEIGHT + (phone ? 56 : 60), opacity: headOpacity }}
        >
          <p
            aria-hidden
            className="font-display text-title text-[1.6rem] leading-[1.35] md:text-[2rem]"
          >
            {t('gifts.title')}
          </p>
          <div role="tablist" aria-label={t('gifts.chapters')} className="mt-1 flex justify-center">
            {chapters.map((c, ci) => {
              const active = page?.chapter === ci
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={shown ? 0 : -1}
                  title={c.title}
                  onClick={() => goChapter(ci)}
                  className={`font-sans border-b px-2 py-3 text-[0.6rem] tracking-[0.22em] whitespace-nowrap uppercase transition-colors md:px-4 md:text-[0.65rem] md:tracking-[0.3em] ${
                    active
                      ? 'text-title border-amber-deep'
                      : 'text-title/60 hover:text-title border-transparent'
                  }`}
                >
                  {c.tab}
                </button>
              )
            })}
          </div>
        </motion.div>

        <div
          className="absolute inset-x-0 flex items-center justify-center"
          style={{ top, bottom }}
        >
          <Arrow
            dir={-1}
            hidden={!shown || at === 0}
            onClick={() => go(at - 1)}
            label={t('gifts.prevPage')}
            phone={phone}
          />
          <AnimatePresence mode="wait" custom={dir}>
            {shown && page && (
              // As few columns as fill the rows evenly (5 lie 3 + 2), the
              // shorter row centred under the fuller one. A swipe turns the
              // page on a touch screen.
              <motion.div
                key={at}
                role="tabpanel"
                aria-label={chapters[page.chapter].title}
                className="flex flex-wrap content-center justify-center"
                style={{
                  width:
                    Math.min(cols, Math.ceil(page.gifts.length / rows)) * (cardW + gapX) - gapX,
                  columnGap: gapX,
                  rowGap: gapY,
                }}
                drag={phone ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) go(at + 1)
                  else if (info.offset.x > 50) go(at - 1)
                }}
              >
                {page.gifts.map((g, i) => (
                  <motion.div
                    key={g.giftId}
                    style={{ width: cardW }}
                    custom={dir}
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
          <Arrow
            dir={1}
            hidden={!shown || at === pages.length - 1}
            onClick={() => go(at + 1)}
            label={t('gifts.nextPage')}
            phone={phone}
          />
        </div>

        <div className="absolute inset-x-0 text-center" style={{ bottom: phone ? 18 : 26 }}>
          <ScrollHint label={shown ? t('gifts.scrollToEnd') : t('gifts.scrollToBrowse')} />
        </div>
      </div>
    </motion.div>
  )
}

// Cards drop in from above, a little turned, and settle; the leaving ones
// slide off the way the list goes. `custom` is the direction: 1 forwards.
const DEAL: Variants = {
  enter: (dir: number) => ({ opacity: 0, y: -28, x: 24 * dir, rotate: 4 * dir, scale: 0.97 }),
  rest: { opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 },
  leave: (dir: number) => ({
    opacity: 0,
    x: -36 * dir,
    rotate: -3 * dir,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
  }),
}

/** A thin chevron beside the polaroids: the previous or next page. */
function Arrow({
  dir,
  hidden,
  onClick,
  label,
  phone,
}: {
  dir: 1 | -1
  hidden: boolean
  onClick: () => void
  label: string
  phone: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={hidden}
      className={`text-title hover:text-amber-deep shrink-0 p-3 transition-[opacity,color] duration-300 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      } ${phone ? '-mx-1' : 'mx-4'}`}
    >
      <svg viewBox="0 0 24 24" className={phone ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden>
        <path
          d={dir === 1 ? 'M9 4.5l7.5 7.5L9 19.5' : 'M15 4.5L7.5 12l7.5 7.5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
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
