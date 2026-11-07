import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
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

// The section's own scroll, as fractions of it. It pins with the title
// already in the middle of the desk (the RSVP drew it there as its reply
// card left); the title rises to the top (RISE) and the deck is dealt and
// opens into a fan under it (from FAN_AT); a short stay, then the page
// goes on.
const RISE = [0.04, 0.42]
const FAN_AT = 0.3
// Section height, and the scroll it pins for (the height but one screen).
const HEIGHT_VH = 180
const PINNED_VH = HEIGHT_VH - 100

interface Chapter {
  id: string
  title: string
  gifts: Gift[]
}

interface Props {
  gifts: Gift[]
  /**
   * Renders one gift's polaroid at the given width; `inactive` for a card
   * lying in the fan (not the one in front): not focusable, not clickable.
   */
  renderCard: (gift: Gift, index: number, width: number, inactive?: boolean) => ReactNode
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
 * The fan's geometry: the card in front, upright and full size, and the
 * others lying smaller along an arc to each side of it.
 */
function fanLayout(w: number, h: number) {
  const phone = w < 640
  const top = NAV_HEIGHT + (phone ? 140 : 168)
  const bottom = phone ? 104 : 136
  // The card in front fills the height left between the title and the foot.
  const frontW = Math.min(256, (h - top - bottom) / CARD_ASPECT, w * (phone ? 0.58 : 0.3))
  const frontH = frontW * CARD_ASPECT
  const frontY = top + frontH / 2
  const side = phone ? 0.6 : 0.68
  // The first card to each side clears most of the front one; the rest
  // overlap one another, a hand of cards.
  const first = frontW * 0.5 + frontW * side * (phone ? 0.2 : 0.3)
  const step = frontW * side * (phone ? 0.24 : 0.42)
  const radius = phone ? 900 : 1500
  const reach = phone ? 5 : 8
  return { phone, frontW, frontY, frontH, side, first, step, radius, reach }
}

/** Where card `d` places away from the front one lies in the fan. */
function fanSpot(d: number, F: ReturnType<typeof fanLayout>) {
  if (d === 0) return { x: 0, y: F.frontY, rotate: 0, scale: 1 }
  const n = Math.abs(d)
  const x = Math.sign(d) * (F.first + (n - 1) * F.step)
  const a = x / F.radius
  // Lying lower than the front card (whose foot they tuck under), and lower
  // still along the arc.
  const y = F.frontY + F.frontH * (1 - F.side) * 0.5 + F.radius * (1 - Math.cos(a))
  return { x, y, rotate: (a * 180) / Math.PI, scale: F.side }
}

/**
 * The gift list on the invitation's desk. It lies over the end of the RSVP
 * section and takes the screen as it pins — the same paper, the same
 * wildflowers, the reply card just gone — so there is no seam. The scroll
 * brings the title up and deals the gifts as a deck that opens into a fan;
 * from there the guest turns the fan by hand: a drag, the arrows, a click
 * on a card at the side. The card in front opens its gift.
 */
export function GiftChapters({ gifts, renderCard }: Props) {
  const { t, i18n } = useTranslation()
  const nameOf = (g: Gift) => (i18n.language === 'pt' ? g.name_pt : g.name_en)
  const chapters = useChapters(gifts)
  // The fan's order: chapter by chapter.
  const list = useMemo(() => chapters.flatMap((c) => c.gifts), [chapters])
  const chapterOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of chapters) for (const g of c.gifts) m.set(g.giftId, c.title)
    return m
  }, [chapters])
  const { w, h } = useScreen()
  const F = fanLayout(w, h)
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
  const sectionOpacity = useTransform(arrival, (v) => (v >= 0.999 ? 1 : 0))
  const sectionEvents = useTransform(arrival, (v) => (v >= 0.999 ? 'auto' : 'none'))

  const L = giftsTitleLayout(w, h)
  const rise = useTransform(p, (v) => easeInOut(ramp(v, RISE)))
  const titleY = useTransform(rise, (r) => L.midY + (L.topY - L.midY) * r)
  const titleScale = useTransform(rise, (r) => 1 + (L.endScale - 1) * r)
  const labelOpacity = useTransform(p, (v) => ramp(v, [RISE[1] - 0.08, RISE[1]]))

  // The deck is dealt once the scroll reaches FAN_AT, and gathered back up
  // if it goes back above it. Once dealt, a turn of the fan moves at once
  // (no dealing delay).
  const [open, setOpen] = useState(false)
  const [dealt, setDealt] = useState(false)
  const dealTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useMotionValueEvent(p, 'change', (v) => {
    const now = v >= FAN_AT
    if (now === open) return
    setOpen(now)
    clearTimeout(dealTimer.current)
    if (now) dealTimer.current = setTimeout(() => setDealt(true), 900)
    else setDealt(false)
  })
  useEffect(() => () => clearTimeout(dealTimer.current), [])

  const [front, setFront] = useState(0)
  const go = (to: number) => setFront(Math.max(0, Math.min(list.length - 1, to)))

  // A trackpad's sideways swipe turns the fan, a card per notch.
  const wheel = useRef(0)
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
    wheel.current += e.deltaX
    if (Math.abs(wheel.current) >= 60) {
      go(front + Math.sign(wheel.current))
      wheel.current = 0
    }
  }

  const current = list[front]
  return (
    <motion.div
      ref={sectionRef}
      className="relative"
      style={{ height: `${HEIGHT_VH}vh`, opacity: sectionOpacity, pointerEvents: sectionEvents }}
    >
      {/* The nav's "Presentes" lands here: the fan open on the desk. */}
      <div
        id="gifts-list"
        className="absolute inset-x-0"
        style={{ top: `${(RISE[1] + 0.04) * PINNED_VH}vh` }}
      />
      <div className="bg-peach bg-paper sticky top-0 h-[100svh] overflow-hidden">
        {deskGeo && <DeskFlowers g={deskGeo} desk={deskLayout(deskGeo)} />}

        <GiftsTitle y={titleY} scale={titleScale} />

        {/* The chapter of the card in front, under the title. */}
        <motion.p
          aria-hidden
          className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.35em] uppercase"
          style={{ top: L.topY + (F.phone ? 38 : 48), opacity: labelOpacity }}
        >
          {current ? chapterOf.get(current.giftId) : ''}
        </motion.p>

        {/* The fan. A group the arrow keys turn; a drag or a sideways swipe
            turns it too. */}
        <motion.div
          role="group"
          aria-roledescription={t('gifts.fanRole')}
          aria-label={t('gifts.title')}
          tabIndex={open ? 0 : -1}
          className="absolute inset-0 touch-pan-y outline-offset-[-12px]"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(front + 1)
            if (e.key === 'ArrowLeft') go(front - 1)
          }}
          onWheel={onWheel}
          onPanEnd={(_, info) => {
            const n = Math.round(-info.offset.x / Math.max(40, F.step * 1.4))
            if (n) go(front + n)
          }}
        >
          {list.map((g, i) => {
            const d = i - front
            const far = Math.abs(d) > F.reach
            const spot = fanSpot(Math.max(-F.reach - 1, Math.min(F.reach + 1, d)), F)
            // Gathered: the deck, lying under where the front card goes.
            const deck = { x: 0, y: F.frontY + 40, rotate: ((i * 37) % 9) - 4, scale: F.side }
            const at = open ? spot : deck
            return (
              <motion.div
                key={g.giftId}
                className="absolute top-0 left-1/2"
                style={{
                  width: F.frontW,
                  marginLeft: -F.frontW / 2,
                  marginTop: -F.frontH / 2,
                  zIndex: 100 - Math.abs(d),
                  pointerEvents: open && !far ? 'auto' : 'none',
                }}
                initial={false}
                animate={{
                  x: at.x,
                  y: at.y,
                  rotate: at.rotate,
                  scale: at.scale,
                  opacity: open ? (far ? 0 : 1) : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 170,
                  damping: 24,
                  // Dealt from the middle out the first time it opens.
                  delay: open && !dealt ? 0.08 + Math.abs(d) * 0.045 : 0,
                }}
              >
                {renderCard(g, i, F.frontW, d !== 0)}
                {d !== 0 && (
                  // A card at the side: a click brings it to the front.
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onClick={() => go(i)}
                    className="absolute inset-0 cursor-pointer"
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>

        <Arrow
          dir={-1}
          hidden={!open || front === 0}
          onClick={() => go(front - 1)}
          label={t('gifts.prevPage')}
          y={F.frontY + F.frontH / 2 + (F.phone ? 36 : 40)}
          x={F.phone ? 12 : 16}
        />
        <Arrow
          dir={1}
          hidden={!open || front === list.length - 1}
          onClick={() => go(front + 1)}
          label={t('gifts.nextPage')}
          y={F.frontY + F.frontH / 2 + (F.phone ? 36 : 40)}
          x={F.phone ? 12 : 16}
        />

        {/* Read out as the fan turns. */}
        <p aria-live="polite" className="sr-only">
          {open && current
            ? t('gifts.fanAt', { name: nameOf(current), n: front + 1, total: list.length })
            : ''}
        </p>

        <div className="absolute inset-x-0 text-center" style={{ bottom: F.phone ? 18 : 26 }}>
          <ScrollHint label={open ? t('gifts.scrollToEnd') : t('gifts.scrollToBrowse')} />
        </div>
      </div>
    </motion.div>
  )
}

/** A thin chevron under the card in front: the previous or next gift. */
function Arrow({
  dir,
  hidden,
  onClick,
  label,
  x,
  y,
}: {
  dir: 1 | -1
  hidden: boolean
  onClick: () => void
  label: string
  /** Distance from the screen's middle to the arrow's inner edge (under
   * the card in front, clear of the fan). */
  x: number
  y: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={hidden}
      className={`text-title hover:text-amber-deep absolute z-[200] -translate-y-1/2 rounded-full bg-peach/70 p-3 backdrop-blur-sm transition-[opacity,color] duration-300 ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{
        top: y,
        left: dir === 1 ? `calc(50% + ${x}px)` : undefined,
        right: dir === -1 ? `calc(50% + ${x}px)` : undefined,
      }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path
          d={dir === 1 ? 'M9 4.5l7.5 7.5L9 19.5' : 'M15 4.5L7.5 12l7.5 7.5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
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
