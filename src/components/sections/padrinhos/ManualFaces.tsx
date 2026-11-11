import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG, type PadrinhosPanel } from '../../../content.config'
import { EMBOSS_SHADOW } from '../../ui/emboss'
import { GOLD, ScriptText, TAB_PAPER } from '../passport/Pages'

const BASE = import.meta.env.BASE_URL
/** The wildflowers growing up from the cover's foot (2000 × 477). */
const BORDER = `${BASE}flowers/wildflower_border.webp`
const BORDER_ASPECT = 477 / 2000
/** How wide the border is drawn, as a multiple of the shut manual's width. */
const BORDER_SPAN = 3.4

type Lang = 'pt' | 'en'
export type Side = 'left' | 'right'

/** The card stock: the passport tabs' plain paper. */
export const CARD_PAPER = TAB_PAPER

/** A sheet's edge: a hairline of shade, as the paper's thickness catches the light. */
const EDGE = 'inset 0 0 0 1px rgba(150, 115, 60, 0.18)'

/**
 * One flap's outside: half of the cover. `w` × `h` is the flap (px); the
 * shut manual is `2w` wide. The names sit one on each flap, meeting at the
 * seam as the flaps do, and the wildflowers run across both.
 */
export function CoverHalf({ side, w, h }: { side: Side; w: number; h: number }) {
  const { t } = useTranslation()
  const full = 2 * w
  const bw = full * BORDER_SPAN
  const bh = bw * BORDER_ASPECT
  // The border centred on the whole cover; each flap shows its own half.
  const bx = (full - bw) / 2 - (side === 'right' ? w : 0)
  const [coverA, coverB] = splitInTwo(t('padrinhos.cover'))
  const name = side === 'left' ? CONFIG.couple.bride : `& ${CONFIG.couple.groom}`
  const script = side === 'left' ? coverA : coverB
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `url(${BORDER}) ${bx.toFixed(1)}px ${(h - bh).toFixed(1)}px / ${bw.toFixed(1)}px auto no-repeat, ${CARD_PAPER}`,
        boxShadow: EDGE,
        // Sized by the flap's width: the names must fit it.
        fontSize: w / 10,
      }}
    >
      <div
        className={`absolute inset-x-0 flex flex-col ${
          side === 'left' ? 'items-end pr-[0.7em]' : 'items-start pl-[0.7em]'
        }`}
        style={{ top: '24%' }}
      >
        <span className="font-sans text-forest-deep text-[1em] leading-none tracking-[0.3em] whitespace-nowrap uppercase">
          {name}
        </span>
        <span
          className="font-script text-honey mt-[0.5em] text-[1.55em] leading-[1.7] whitespace-nowrap"
          style={{ textShadow: EMBOSS_SHADOW }}
        >
          <ScriptText>{script}</ScriptText>
        </span>
      </div>
      {/* The seam: each flap's inner edge a touch darker, where they meet. */}
      <div
        aria-hidden
        className={`absolute inset-y-0 w-[6%] ${side === 'left' ? 'right-0' : 'left-0'}`}
        style={{
          background: `linear-gradient(to ${side === 'left' ? 'left' : 'right'}, rgba(120, 90, 45, 0.12), rgba(120, 90, 45, 0))`,
        }}
      />
    </div>
  )
}

/** The shut manual as it lies on the desk: both flaps side by side. */
export function CoverFace({ w, h }: { w: number; h: number }) {
  const half = w / 2
  return (
    <>
      <div className="absolute inset-y-0 left-0" style={{ width: half }}>
        <CoverHalf side="left" w={half} h={h} />
      </div>
      <div className="absolute inset-y-0 right-0" style={{ width: half }}>
        <CoverHalf side="right" w={half} h={h} />
      </div>
    </>
  )
}

/**
 * The inside of one of the three panels. `wide`: the middle one (as wide as
 * the shut manual); the flaps are half that.
 */
export function PanelFace({
  panel,
  lang,
  h,
  wide,
}: {
  panel: PadrinhosPanel
  lang: Lang
  h: number
  wide: boolean
}) {
  const pt = lang === 'pt'
  const kicker = (pt ? panel.kicker_pt : panel.kicker_en) || weddingDate(lang)
  const title = pt ? panel.title_pt : panel.title_en
  const intro = pt ? panel.intro_pt : panel.intro_en
  const style: CSSProperties = {
    background: CARD_PAPER,
    boxShadow: EDGE,
    fontSize: h / (wide ? 46 : 52),
  }
  return (
    <div
      className={`absolute inset-0 flex flex-col overflow-hidden text-center ${
        wide ? 'px-[9%]' : 'px-[11%]'
      } pt-[16%]`}
      style={style}
    >
      <p className="font-sans text-amber-deep text-[max(0.82em,9px)] tracking-[0.3em] text-balance uppercase">
        {kicker}
      </p>
      <h3
        className={`font-script text-honey mt-[0.35em] leading-[1.5] ${wide ? 'text-[3em]' : 'text-[2.3em]'}`}
        style={{ textShadow: EMBOSS_SHADOW }}
      >
        <ScriptText>{title}</ScriptText>
      </h3>
      {intro && (
        <p className="font-serif text-forest-deep/90 mx-auto mt-[0.5em] max-w-[26em] text-[1.18em] leading-[1.45] text-pretty">
          {intro}
        </p>
      )}
      {panel.items.length > 0 && (
        // The day as a thread: times on the left, a gold dot on the line
        // for each moment, what happens on the right.
        <ol className="relative mx-auto mt-[1.8em] grid w-full max-w-[22em] grid-cols-[5.5em_1.8em_1fr] text-left">
          <span
            aria-hidden
            className="absolute top-[1.1em] bottom-[1.1em] left-[6.4em] w-px"
            style={{ background: `${GOLD}aa` }}
          />
          {panel.items.map((item, i) => (
            <li key={i} className="col-span-3 grid grid-cols-subgrid items-center py-[0.55em]">
              <span className="font-sans text-amber-deep text-right text-[max(0.85em,9px)] tracking-[0.12em] uppercase tabular-nums">
                {pt ? item.label_pt : item.label_en}
              </span>
              <span
                aria-hidden
                className="relative z-10 mx-auto h-[0.5em] w-[0.5em] rounded-full"
                style={{ background: GOLD, boxShadow: '0 0 0 0.25em #FBF6EC' }}
              />
              <span className="font-serif text-forest-deep min-w-0 text-[1.15em] leading-snug">
                {pt ? item.text_pt : item.text_en}
              </span>
            </li>
          ))}
        </ol>
      )}
      {panel.palette.length > 0 && (
        <ul className="mt-[1.8em] flex flex-wrap justify-center gap-[0.8em]">
          {panel.palette.map((c) => (
            <li
              key={c}
              aria-hidden
              className="h-[2.6em] w-[2.6em] rounded-full"
              // A dab of watercolour, not a flat disc.
              style={{
                background: `radial-gradient(circle at 38% 34%, ${c}cc 0%, ${c} 55%, ${c}e6 100%)`,
                boxShadow: `0 0 0 1px ${c}55, 0 1px 2px rgba(80, 60, 30, 0.18)`,
              }}
            />
          ))}
        </ul>
      )}
      {wide && (
        // The cover's wildflowers again, lower, at the middle panel's foot.
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] opacity-90"
          style={{ background: `url(${BORDER}) center bottom / 160% auto no-repeat` }}
        />
      )}
    </div>
  )
}

/** The wedding date, written out in the language. */
function weddingDate(lang: Lang) {
  const [y, m, d] = CONFIG.wedding.date.split('-').map(Number)
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** A phrase cut in two near-equal halves at a word break (one per flap). */
function splitInTwo(text: string): [string, string] {
  const words = text.split(' ')
  let best: [string, string] = [text, '']
  let gap = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    if (Math.abs(a.length - b.length) < gap) {
      gap = Math.abs(a.length - b.length)
      best = [a, b]
    }
  }
  return best
}
