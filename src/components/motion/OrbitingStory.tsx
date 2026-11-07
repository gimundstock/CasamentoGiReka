import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useMotionValueEvent, type MotionValue } from 'framer-motion'

export interface OrbitItem {
  imageSrc: string
  imageAlt: string
  year: string
  title: string
  text: string
}

interface Props {
  items: OrbitItem[]
  scrollProgress: MotionValue<number>
  /** Progress where the first photo starts coming up from below. */
  scrollStart: number
  /** Progress by which the last milestone must have left the screen. */
  scrollEnd: number
  /** Degrees the flower turns per unit of progress — the orbit follows it. */
  degPerProgress: number
}

// How much each half-turn slows down at the sides (where the milestone is
// read) and speeds up across the top and bottom (where it is off-screen).
// 0 = constant speed, must stay < 1 so the turn never stops or reverses.
const DWELL = 0.6

/**
 * The story milestones orbit the spinning flower, clockwise, with it.
 *
 * Two slots ride opposite ends of one ellipse around the flower center:
 * the photo and the caption. The photo comes up from below on the left
 * while the caption comes down on the right (image › flower › text); half
 * a turn later both have swung off-screen — photo over the top, caption
 * under the bottom — and come back swapped (text › flower › image). The
 * milestone changes at that off-screen moment, so every half-turn shows
 * the next one.
 *
 * The ellipse is as wide as the screen allows and taller than the screen,
 * so the top and bottom of the orbit are always out of view. The caption
 * card rides upright; only the photo leans as it travels.
 *
 * A phone has no room for the two side by side: there the polaroid sits on
 * top of the caption card, the two as one piece passing through the middle.
 */
export function OrbitingStory({
  items,
  scrollProgress,
  scrollStart,
  scrollEnd,
  degPerProgress,
}: Props) {
  const N = items.length
  const totalDeg = 180 * N
  // Follow the flower when the whole orbit fits before scrollEnd, otherwise
  // turn just fast enough to finish in time.
  const rate = Math.max(degPerProgress, totalDeg / Math.max(1e-6, scrollEnd - scrollStart))

  const [index, setIndex] = useState(0)
  const [itemWidth, setItemWidth] = useState(358)
  const [textWidth, setTextWidth] = useState(358)
  const [vw, setVw] = useState(() => window.innerWidth)
  const phone = vw < 768
  const imageRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const imageX = useMotionValue(0)
  const imageY = useMotionValue(0)
  const imageRotate = useMotionValue(0)
  const textX = useMotionValue(0)
  const textY = useMotionValue(0)
  const opacity = useMotionValue(0)

  const update = useCallback(
    (v: number) => {
      const W = window.innerWidth
      const H = window.innerHeight
      const theta = (v - scrollStart) * rate
      if (N === 0 || theta <= 0 || theta >= totalDeg) {
        opacity.set(0)
        return
      }
      opacity.set(1)

      const half = Math.min(Math.floor(theta / 180), N - 1)
      setIndex(half)
      const phi = ((theta - half * 180) * Math.PI) / 180
      const eased = half * Math.PI + phi + (DWELL / 2) * Math.sin(2 * phi)

      // Size of the orbit. Horizontally: just outside the flower if the
      // screen is wide enough, else as far out as fits. Vertically: past
      // the screen edge by the tallest slot, so the swap is never seen.
      // On a phone, the photo-and-caption piece goes straight through the
      // middle.
      const onPhone = W < 768
      const w = onPhone ? W - 32 : Math.min(358, W * 0.36)
      const tw = captionWidth(W)
      const flowerRadius = 0.312 * Math.min(W, H)
      const rx = onPhone ? 0 : Math.min(flowerRadius + w * 0.35, W / 2 - w / 2 - 12)
      // The caption, wider on desktop, keeps the same overlap with the flower.
      const trx = Math.min(flowerRadius + tw * 0.35, W / 2 - tw / 2 - 12)
      const tallest = Math.max(
        imageRef.current?.offsetHeight ?? w * 1.5,
        textRef.current?.offsetHeight ?? w
      )
      const ry = H / 2 + tallest / 2 + 40

      // The photo starts at the bottom (90°), the caption opposite it.
      const a = Math.PI / 2 + eased
      const b = a + Math.PI
      imageX.set(rx * Math.cos(a))
      imageY.set(ry * Math.sin(a))
      imageRotate.set(onPhone ? 0 : 8 * Math.sin(a))
      textX.set(trx * Math.cos(b))
      textY.set(ry * Math.sin(b))
    },
    [N, rate, scrollStart, totalDeg, opacity, imageX, imageY, imageRotate, textX, textY]
  )

  useMotionValueEvent(scrollProgress, 'change', update)

  useEffect(() => {
    function onResize() {
      setItemWidth(Math.min(358, window.innerWidth * 0.36))
      setTextWidth(captionWidth(window.innerWidth))
      setVw(window.innerWidth)
      update(scrollProgress.get())
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [update, scrollProgress])

  if (N === 0) return null
  const item = items[index]

  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ opacity }}>
      <motion.div
        className="absolute top-1/2 left-1/2"
        style={{ x: imageX, y: imageY, rotate: imageRotate }}
      >
        {phone ? (
          <div ref={imageRef} className="-translate-x-1/2 -translate-y-1/2">
            <PhonePiece item={item} width={vw - 32} />
          </div>
        ) : (
          <div
            ref={imageRef}
            className="-translate-x-1/2 -translate-y-1/2"
            style={{ width: itemWidth }}
          >
            <Polaroid item={item} />
          </div>
        )}
      </motion.div>
      {!phone && (
        <motion.div className="absolute top-1/2 left-1/2" style={{ x: textX, y: textY }}>
          <div
            ref={textRef}
            className="-translate-x-1/2 -translate-y-1/2"
            style={{ width: textWidth }}
          >
            <StoryCard className="px-9 pt-8 pb-9 text-center">
              <StoryWords item={item} />
            </StoryCard>
          </div>
        </motion.div>
      )}
      {/* Preload every photo so the swap off-screen never shows a blank frame. */}
      <div className="hidden">
        {items.map((it) => (
          <img key={it.imageSrc} src={it.imageSrc} alt="" />
        ))}
      </div>
    </motion.div>
  )
}

/** The caption card's width: as wide as the photo, a little wider on desktop
 * so a longer text reads in fewer lines. */
function captionWidth(W: number) {
  return W >= 1024 ? Math.min(440, W * 0.31) : Math.min(358, W * 0.36)
}

function Polaroid({ item, className = '' }: { item: OrbitItem; className?: string }) {
  return (
    // Polaroid frame, same as the welcome carousel.
    <div
      className={`rounded-[3px] bg-white p-2 pb-10 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.45)] md:p-3 md:pb-14 ${className}`}
    >
      <img
        src={item.imageSrc}
        alt={item.imageAlt}
        className="aspect-[4/5] w-full rounded-[1px] object-cover"
        decoding="async"
      />
    </div>
  )
}

/**
 * A milestone's words: the year as a small label, the title in script, the
 * text in full ink, justified from tablet up (left-aligned on a phone, where
 * the lines are too short to justify).
 */
function StoryWords({ item }: { item: OrbitItem }) {
  return (
    <>
      <p className="font-sans text-amber-deep text-[0.8rem] tracking-[0.4em] uppercase md:text-[0.85rem]">
        {item.year}
      </p>
      <h3 className="font-display text-title mt-3 pb-1 text-[1.5rem] leading-[1.35] md:text-[1.8rem]">
        {item.title}
      </h3>
      <p className="font-serif text-title mt-4 text-left text-[0.95rem] leading-relaxed whitespace-pre-line md:mt-5 md:text-justify md:text-[1.0625rem] md:[hyphens:auto]">
        {item.text}
      </p>
    </>
  )
}

/** The caption card: the original one's paper colour, corners and shadow. */
function StoryCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-[3px] bg-peach-light/90 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

/** On a phone: the polaroid set on top of the caption card, as one piece. */
function PhonePiece({ item, width }: { item: OrbitItem; width: number }) {
  return (
    <div style={{ width }}>
      <div className="relative z-10 mx-auto -mb-12 -rotate-3" style={{ width: width * 0.5 }}>
        <Polaroid item={item} />
      </div>
      <StoryCard className="px-6 pt-16 pb-7 text-left">
        <StoryWords item={item} />
      </StoryCard>
    </div>
  )
}
