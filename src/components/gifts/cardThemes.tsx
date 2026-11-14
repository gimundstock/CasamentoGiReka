import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type CardThemeId =
  | 'cerrado'
  | 'junina'
  | 'dogs'
  | 'zelda'
  | 'wow'
  | 'luxembourg'
  | 'italy'
  | 'up'

export interface CardTheme {
  id: CardThemeId
  label_pt: string
  label_en: string
  /** Watercolour template in /public/cards (1484 × 1060, blank paper in the middle). */
  image: string
  /** Text colour that reads on the template's paper. */
  ink: string
  /** Where the message sits, as a % of the card: the blank area of each template. */
  area: { top: number; height: number; left?: number; width?: number }
}

const base = import.meta.env.BASE_URL
const img = (name: string) => `${base}cards/${name}.webp`

export const CARD_ASPECT = 1484 / 1060

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'cerrado',
    label_pt: 'Cerrado',
    label_en: 'Cerrado',
    image: img('cerrado'),
    ink: '#4A4033',
    area: { top: 16, height: 49, left: 26, width: 48 },
  },
  {
    id: 'junina',
    label_pt: 'Festa junina',
    label_en: 'Festa junina',
    image: img('junina'),
    ink: '#4A4033',
    area: { top: 25, height: 38, left: 20, width: 60 },
  },
  {
    id: 'dogs',
    label_pt: 'Doguinhos',
    label_en: 'Doggos',
    image: img('dogs'),
    ink: '#4A4033',
    area: { top: 6, height: 36, left: 14, width: 72 },
  },
  {
    id: 'zelda',
    label_pt: 'Zelda',
    label_en: 'Zelda',
    image: img('zelda'),
    ink: '#4A4033',
    area: { top: 18, height: 40, left: 16, width: 62 },
  },
  {
    id: 'wow',
    label_pt: 'WoW',
    label_en: 'WoW',
    // Silvermoon: the paper is clear between the castle's light and the lantern.
    image: img('wow'),
    ink: '#4A4033',
    area: { top: 16, height: 47, left: 33, width: 44 },
  },
  {
    id: 'luxembourg',
    label_pt: 'Luxemburgo',
    label_en: 'Luxembourg',
    image: img('luxembourg'),
    ink: '#4A4033',
    area: { top: 14, height: 44, left: 18, width: 64 },
  },
  {
    id: 'italy',
    label_pt: 'Itália',
    label_en: 'Italy',
    image: img('italy'),
    ink: '#4A4033',
    area: { top: 16, height: 40, left: 18, width: 64 },
  },
  {
    id: 'up',
    label_pt: 'Up!',
    label_en: 'Up!',
    image: img('up'),
    ink: '#4A4033',
    area: { top: 16, height: 40, left: 20, width: 56 },
  },
]

export function getCardTheme(id: CardThemeId): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]
}

/** Message sizes, in container-width units, from the biggest down. */
const SIZES = [3, 2.7, 2.4, 2.1, 1.9, 1.7]
/**
 * A card takes at most this many line breaks: more lines than this would
 * have to be too small to read to fit the paper. The rest become spaces.
 */
export const MAX_CARD_LINE_BREAKS = 10

/** The message as typed, with the line breaks past MAX_CARD_LINE_BREAKS made spaces. */
export function limitLineBreaks(text: string): string {
  const parts = text.split('\n')
  if (parts.length <= MAX_CARD_LINE_BREAKS + 1) return text
  return (
    parts.slice(0, MAX_CARD_LINE_BREAKS + 1).join('\n') +
    ' ' +
    parts.slice(MAX_CARD_LINE_BREAKS + 1).join(' ')
  )
}

/** Below the sizes above, a message keeps shrinking until it fits; never under this. */
export const MIN_MESSAGE_CQW = 0.6
/** Each step of that shrinking. */
export const SHRINK_STEP = 0.92
// How wide an average character of the serif is, in em.
const CHAR_EM = 0.46
// The message's line height, in em; the signature's size, the gap above it
// (container-width units) and its line height, in em. The card on the page and
// its image (utils/cardImage) both lay themselves out from these.
export const MESSAGE_LINE_HEIGHT = 1.375
export const SIGNATURE_CQW = 2.4
export const SIGNATURE_GAP_CQW = 2
export const SIGNATURE_LINE_HEIGHT = 1.25
const SIGNATURE_BLOCK_CQW = SIGNATURE_GAP_CQW + SIGNATURE_CQW * SIGNATURE_LINE_HEIGHT

/**
 * A first guess at the message's size in container-width units: shrinking as
 * it grows, and as big as fits the theme's writing area (its width and height
 * in the same units) by an average character width. The card then measures
 * the real text and shrinks further while it doesn't fit (MessageCard, and
 * utils/cardImage for its picture): whatever was typed stays on the paper.
 */
export function estimateMessageSize(
  message: string,
  hasName: boolean,
  areaW: number,
  areaH: number
): number {
  const byLength =
    message.length <= 90 ? 3 : message.length <= 180 ? 2.7 : message.length <= 280 ? 2.4 : 2.1
  const room = areaH - (hasName ? SIGNATURE_BLOCK_CQW : 0)
  const fits = (size: number) => {
    const perLine = Math.max(1, Math.floor(areaW / (size * CHAR_EM)))
    const lines = message
      .split('\n')
      .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / perLine)), 0)
    return lines * size * MESSAGE_LINE_HEIGHT <= room
  }
  return SIZES.find((s) => s <= byLength && fits(s)) ?? SIZES[SIZES.length - 1]
}

/** The card: the watercolour template with the guest's message written on top. */
export function MessageCard({
  theme,
  message,
  from,
  placeholder,
}: {
  theme: CardTheme
  message: string
  from: string
  placeholder?: string
}) {
  const { top, height, left = 15, width = 70 } = theme.area
  // The writing area in container-width units (the card is CARD_ASPECT wide for its height).
  const areaW = width
  const areaH = (height / 100) * (100 / CARD_ASPECT)
  const text = message || placeholder || ''

  // Start from the estimate; while the real text is taller than the area,
  // shrink it, measuring each step (before the paint, so it never shows
  // cut). Set on the element itself, and measured again once the fonts load.
  const estimate = estimateMessageSize(text, !!from, areaW, areaH)
  const areaRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const messageRef = useRef<HTMLParagraphElement>(null)
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let live = true
    document.fonts?.ready.then(() => live && setFontsReady(true))
    return () => {
      live = false
    }
  }, [])
  useLayoutEffect(() => {
    const area = areaRef.current
    const inner = innerRef.current
    const p = messageRef.current
    if (!area || !inner || !p) return
    let size = estimate
    p.style.fontSize = `${size}cqw`
    while (inner.offsetHeight > area.clientHeight + 0.5 && size > MIN_MESSAGE_CQW) {
      size = Math.max(MIN_MESSAGE_CQW, size * SHRINK_STEP)
      p.style.fontSize = `${size}cqw`
    }
  }, [estimate, text, from, theme.id, fontsReady])

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-lg border border-black/10 shadow-sm"
      style={{ aspectRatio: String(CARD_ASPECT), containerType: 'inline-size' }}
    >
      <img
        src={theme.image}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover"
      />
      <div
        ref={areaRef}
        className="absolute flex min-w-0 flex-col items-center justify-center overflow-hidden text-center"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${width}%`,
          color: theme.ink,
        }}
      >
        <div ref={innerRef} className="flex w-full min-w-0 flex-col items-center">
          {/* Lines break at the area's width whatever was typed: a long run with
            no spaces or line breaks wraps too, it never runs off the paper. */}
          <p
            ref={messageRef}
            className="font-serif w-full min-w-0 whitespace-pre-line [overflow-wrap:anywhere]"
            style={{
              lineHeight: MESSAGE_LINE_HEIGHT,
              opacity: message ? 1 : 0.5,
            }}
          >
            {text}
          </p>
          {/* The name signs it: small, at the lower right of the text. */}
          {from && (
            <p
              className="font-display max-w-full self-end text-right [overflow-wrap:anywhere]"
              style={{
                fontSize: `${SIGNATURE_CQW}cqw`,
                marginTop: `${SIGNATURE_GAP_CQW}cqw`,
                lineHeight: SIGNATURE_LINE_HEIGHT,
              }}
            >
              {from}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
