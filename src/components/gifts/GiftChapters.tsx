import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  type Variants,
} from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../content.config'
import type { Gift } from '../../types'
import { NAV_HEIGHT } from '../sections/Envelope'
import { ScrollHint } from '../ui/ScrollHint'

/** A polaroid's height over its width (picture 4:5 plus the strip under it). */
export const CARD_ASPECT = 6.3 / 4

// Scroll (in screens) that each step of the stage takes, and the extra
// stay on the last one before the section lets go.
const STEP_VH = 0.9
const TAIL_VH = 0.5

interface Chapter {
  id: string
  title: string
  tab: string
  gifts: Gift[]
}

interface Page {
  chapter: Chapter
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

/** How many polaroids fit on one screen, and how wide each is. */
function useGrid() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const { w, h } = size
  const phone = w < 640
  const cols = w >= 1024 ? 4 : phone ? 2 : 3
  const rows = 2
  const gapX = w >= 1024 ? 40 : 16
  const gapY = phone ? 20 : 32
  // Room left for the grid: under the nav, the label, the chapter's title
  // and its index; over the hint at the foot.
  const top = NAV_HEIGHT + (phone ? 140 : 176)
  const bottom = phone ? 52 : 64
  const byHeight = (h - top - bottom - gapY * (rows - 1)) / rows / CARD_ASPECT
  const byWidth = (Math.min(w - 32, 1100) - gapX * (cols - 1)) / cols
  const cardW = Math.max(110, Math.min(byHeight, byWidth, 240))
  return { cols, rows, gapX, gapY, cardW, top, phone }
}

/** Splits a chapter into pages of at most `per`, as evenly as possible. */
function paginate(chapters: Chapter[], per: number): Page[] {
  const pages: Page[] = []
  let first = 0
  for (const chapter of chapters) {
    const n = chapter.gifts.length
    const count = Math.ceil(n / per)
    const size = Math.ceil(n / count)
    for (let i = 0; i < n; i += size) {
      pages.push({ chapter, gifts: chapter.gifts.slice(i, i + size), first: first + i })
    }
    first += n
  }
  return pages
}

/**
 * The gift list as the rest of the site is told: one pinned screen, the
 * scroll moving what is on it. The first step is the list's title; then each
 * step is a page of a chapter — its polaroids dealt onto the screen, the
 * last page's sliding away first. The chapter index jumps to any chapter.
 */
export function GiftChapters({ gifts, renderCard }: Props) {
  const { t } = useTranslation()
  const chapters = useChapters(gifts)
  const { cols, rows, gapX, gapY, cardW, top, phone } = useGrid()
  const pages = useMemo(() => paginate(chapters, cols * rows), [chapters, cols, rows])
  const steps = pages.length + 1

  const sectionRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', () => {
    const el = sectionRef.current
    if (!el) return
    const stepPx = window.innerHeight * STEP_VH
    const into = -el.getBoundingClientRect().top
    const next = Math.max(0, Math.min(steps - 1, Math.round(into / stepPx)))
    if (next !== step) {
      setDir(next > step ? 1 : -1)
      setStep(next)
    }
  })

  /** Scrolls to the first page of a chapter. */
  function goTo(chapterId: string) {
    const el = sectionRef.current
    if (!el) return
    const index = pages.findIndex((p) => p.chapter.id === chapterId)
    const top = el.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + (index + 1) * window.innerHeight * STEP_VH, behavior: 'smooth' })
  }

  const page = step > 0 ? pages[step - 1] : null
  const height = `${100 + (steps - 1) * STEP_VH * 100 + TAIL_VH * 100}svh`

  return (
    <div ref={sectionRef} className="relative" style={{ height }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <p
          className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
          style={{ top: NAV_HEIGHT + 32 }}
        >
          {t('nav.gifts')}
        </p>

        {/* Step 0: the list's title and its note. */}
        <AnimatePresence>
          {!page && (
            <motion.div
              key="intro"
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-display text-title text-4xl md:text-5xl">{t('gifts.title')}</h2>
              <p className="font-serif text-title mx-auto mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
                {t('gifts.subtitle')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The chapter's title and the index, from the first page on. */}
        <motion.div
          className="absolute inset-x-0 px-4 text-center"
          style={{ top: NAV_HEIGHT + (phone ? 58 : 62) }}
          animate={{ opacity: page ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          aria-hidden={!page}
        >
          {/* Keyed by chapter: a new title fades in over the old one's place
              (no exit to wait for, so quick jumps never leave a stale one). */}
          <motion.h3
            key={page?.chapter.id ?? 'none'}
            className="font-display text-title text-[1.6rem] leading-[1.35] md:text-[2rem]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {page?.chapter.title ?? ''}
          </motion.h3>
          <nav
            aria-label={t('gifts.chapters')}
            className={`mt-1 flex justify-center ${phone ? 'gap-0' : 'gap-2'}`}
          >
            {chapters.map((c) => {
              const active = page?.chapter.id === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  tabIndex={page ? 0 : -1}
                  onClick={() => goTo(c.id)}
                  aria-current={active ? 'true' : undefined}
                  className={`font-sans border-b px-2 py-3 text-[0.6rem] tracking-[0.25em] whitespace-nowrap uppercase transition-colors md:px-3 md:text-[0.65rem] md:tracking-[0.3em] ${
                    active
                      ? 'text-title border-amber-deep'
                      : 'text-title/60 hover:text-title border-transparent'
                  }`}
                >
                  {c.tab}
                </button>
              )
            })}
          </nav>
        </motion.div>

        {/* The page's polaroids, dealt onto the screen. */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ top, bottom: phone ? 52 : 64 }}
        >
          <AnimatePresence mode="wait" custom={dir}>
            {page && (
              // As few columns as fill the rows evenly (5 lie 3 + 2), the
              // shorter row centred under the fuller one.
              <motion.div
                key={step}
                className="flex flex-wrap content-center justify-center"
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
        </div>

        <div className="absolute inset-x-0 text-center" style={{ bottom: phone ? 18 : 26 }}>
          <ScrollHint
            label={
              step === 0
                ? t('gifts.scrollToBrowse')
                : step === steps - 1
                  ? t('gifts.scrollToEnd')
                  : t('city.passport.hintScroll')
            }
          />
        </div>
      </div>
    </div>
  )
}

// Cards drop in from above, a little turned, and settle; the leaving ones
// slide off the way the list goes. `custom` is the direction: 1 forwards.
const DEAL: Variants = {
  enter: (dir: number) => ({ opacity: 0, y: -28 * dir, rotate: 4 * dir, scale: 0.97 }),
  rest: { opacity: 1, y: 0, rotate: 0, scale: 1 },
  leave: (dir: number) => ({
    opacity: 0,
    x: -36 * dir,
    rotate: -3 * dir,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const },
  }),
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
      {chapters.map((c, ci) => {
        const start = starts[ci]
        return (
          <div key={c.id}>
            <h3 className="font-display text-title mb-10 text-center text-[1.6rem] md:text-[2rem]">
              {c.title}
            </h3>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {c.gifts.map((g, i) => (
                <div key={g.giftId} className="mx-auto w-full max-w-[16rem]">
                  {renderCard(g, start + i, 256)}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
