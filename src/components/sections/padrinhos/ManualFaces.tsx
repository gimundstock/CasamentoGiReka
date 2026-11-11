import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG, type PadrinhosPage } from '../../../content.config'
import { EMBOSS_SHADOW } from '../../ui/emboss'
import { GOLD, ScriptText, TAB_PAPER } from '../passport/Pages'

const BASE = import.meta.env.BASE_URL
/** The wildflowers growing up from the cover's foot (2000 × 477). */
const BORDER = `${BASE}flowers/wildflower_border.webp`
const BORDER_ASPECT = 477 / 2000
/** How wide the border is drawn, as a multiple of the cover's width. */
const BORDER_SPAN = 1.7

type Lang = 'pt' | 'en'

/** The card stock: the passport tabs' plain paper. */
export const CARD_PAPER = TAB_PAPER

/** A sheet's edge: a hairline of shade, as the paper's thickness catches the light. */
const EDGE = 'inset 0 0 0 1px rgba(150, 115, 60, 0.18)'

/**
 * The manual's cover, `w` × `h` (px): the couple's names, the title in
 * script, and wildflowers growing up from its foot.
 */
export function Cover({ w, h }: { w: number; h: number }) {
  const { t } = useTranslation()
  const bw = w * BORDER_SPAN
  const bh = bw * BORDER_ASPECT
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `url(${BORDER}) ${((w - bw) / 2).toFixed(1)}px ${(h - bh).toFixed(1)}px / ${bw.toFixed(1)}px auto no-repeat, ${CARD_PAPER}`,
        boxShadow: EDGE,
        borderRadius: 'inherit',
        fontSize: w / 21,
      }}
    >
      <div
        className="absolute inset-x-0 flex flex-col items-center text-center"
        style={{ top: '22%' }}
      >
        <span className="font-sans text-forest-deep text-[1em] leading-none tracking-[0.3em] whitespace-nowrap uppercase">
          {CONFIG.couple.bride} &amp; {CONFIG.couple.groom}
        </span>
        <span
          className="font-script text-honey mt-[0.75em] px-[8%] text-[2.6em] leading-[1.45] text-balance"
          style={{ textShadow: EMBOSS_SHADOW }}
        >
          <ScriptText>{t('padrinhos.cover')}</ScriptText>
        </span>
      </div>
    </div>
  )
}

/** One of the two pages inside, `h` px tall; `flowers` at its foot. */
export function PageFace({
  page,
  lang,
  h,
  flowers = false,
}: {
  page: PadrinhosPage
  lang: Lang
  h: number
  flowers?: boolean
}) {
  const pt = lang === 'pt'
  const kicker = (pt ? page.kicker_pt : page.kicker_en) || weddingDate(lang)
  const title = pt ? page.title_pt : page.title_en
  const intro = pt ? page.intro_pt : page.intro_en
  const style: CSSProperties = {
    background: CARD_PAPER,
    boxShadow: EDGE,
    borderRadius: 'inherit',
    fontSize: h / 46,
  }
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden px-[9%] pt-[16%] text-center"
      style={style}
    >
      <p className="font-sans text-amber-deep text-[max(0.82em,9px)] tracking-[0.3em] text-balance uppercase">
        {kicker}
      </p>
      <h3
        className="font-script text-honey mt-[0.35em] text-[3em] leading-[1.5]"
        style={{ textShadow: EMBOSS_SHADOW }}
      >
        <ScriptText>{title}</ScriptText>
      </h3>
      {intro && (
        <p className="font-serif text-forest-deep/90 mx-auto mt-[0.5em] max-w-[26em] text-[1.18em] leading-[1.45] text-pretty">
          {intro}
        </p>
      )}
      {page.items.length > 0 && (
        // The day as a thread: times on the left, a gold dot on the line
        // for each moment, what happens on the right.
        <ol className="relative mx-auto mt-[1.8em] grid w-full max-w-[22em] grid-cols-[5.5em_1.8em_1fr] text-left">
          <span
            aria-hidden
            className="absolute top-[1.1em] bottom-[1.1em] left-[6.4em] w-px"
            style={{ background: `${GOLD}aa` }}
          />
          {page.items.map((item, i) => (
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
      {page.palette.length > 0 && (
        <ul className="mt-[1.8em] flex flex-wrap justify-center gap-[0.8em]">
          {page.palette.map((c) => (
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
      {flowers && (
        // The cover's wildflowers again, lower, at the page's foot.
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
