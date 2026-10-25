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
    area: { top: 14, height: 44, left: 22, width: 56 },
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
    image: img('wow'),
    ink: '#34405A',
    area: { top: 14, height: 40, left: 22, width: 56 },
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

/** Message size in container-width units, shrinking as the message grows. */
function messageSize(length: number): string {
  if (length <= 90) return '3.9cqw'
  if (length <= 180) return '3.3cqw'
  if (length <= 280) return '2.8cqw'
  return '2.4cqw'
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
        className="absolute flex flex-col items-center justify-center text-center"
        style={{
          top: `${top}%`,
          height: `${height}%`,
          left: `${left}%`,
          width: `${width}%`,
          color: theme.ink,
        }}
      >
        <p
          className="font-serif whitespace-pre-line leading-snug"
          style={{ fontSize: messageSize(message.length), opacity: message ? 1 : 0.5 }}
        >
          {message || placeholder}
        </p>
        {from && (
          <p className="font-display mt-[2cqw] leading-none" style={{ fontSize: '4.6cqw' }}>
            {from}
          </p>
        )}
      </div>
    </div>
  )
}
