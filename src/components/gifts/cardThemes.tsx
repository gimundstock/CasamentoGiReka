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
    area: { top: 16, height: 49, left: 29, width: 42 },
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
    area: { top: 16, height: 47, left: 37, width: 44 },
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
 * The message's size in container-width units: shrinking as it grows, and
 * never so big that it would not fit the theme's writing area (its width and
 * height in the same units) — whatever was typed, it stays on the paper.
 */
export function messageSize(
  message: string,
  hasName: boolean,
  areaW: number,
  areaH: number
): string {
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
  const size = SIZES.find((s) => s <= byLength && fits(s)) ?? SIZES[SIZES.length - 1]
  return `${size}cqw`
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
        className="absolute flex min-w-0 flex-col items-center justify-center overflow-hidden text-center"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${width}%`,
          color: theme.ink,
        }}
      >
        {/* Lines break at the area's width whatever was typed: a long run with
            no spaces or line breaks wraps too, it never runs off the paper. */}
        <p
          className="font-serif w-full min-w-0 whitespace-pre-line [overflow-wrap:anywhere]"
          style={{
            fontSize: messageSize(message || placeholder || '', !!from, areaW, areaH),
            lineHeight: MESSAGE_LINE_HEIGHT,
            opacity: message ? 1 : 0.5,
          }}
        >
          {message || placeholder}
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
  )
}
