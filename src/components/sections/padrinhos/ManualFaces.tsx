import { useContext, useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { EMBOSS_SHADOW } from '../../ui/emboss'
import { ScriptText } from '../passport/Pages'
import { PadrinhoNames } from './available'

const BASE = import.meta.env.BASE_URL
/** The site's wildflower border (2000 × 477), at a page's foot. */
const BORDER = `${BASE}flowers/wildflower_border.webp`

type Lang = 'pt' | 'en'

/** The card stock: a soft ivory watercolour paper (1254 × 1254). */
export const CARD_PAPER = `url(${BASE}padrinhos/ivory-paper.webp) center / cover`

/** A sheet's edge: a hairline of shade, as the paper's thickness catches the light. */
const EDGE = 'inset 0 0 0 1px rgba(150, 115, 60, 0.1)'

/** The cover's painting: wildflowers up its left edge, water across its foot (1070 × 1470). */
const COVER_ART = `${BASE}padrinhos/cover.webp`

/**
 * The cover's painting with no words: the inside of the cover, facing the
 * page (`mirrored`, its flowers up the other edge), and the back of the
 * card.
 */
export function CoverArt({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{ borderRadius: 'inherit', boxShadow: EDGE }}
    >
      <div
        className={`absolute inset-0 ${mirrored ? '-scale-x-100' : ''}`}
        style={{ background: `url(${COVER_ART}) center / cover` }}
      />
    </div>
  )
}

/**
 * The manual's cover, `w` × `h` (px), on its painting: the title in
 * spaced capitals running up its right edge, from near its top — so it
 * reads even where only that edge shows, the manual lying under the
 * passport on the desk.
 */
export function Cover({ w }: { w: number; h: number }) {
  const { t } = useTranslation()
  const names = useContext(PadrinhoNames)
  // "Iza" / "& Anton", the second set in (a padrinho or two; more, all but
  // the last on the first line).
  const first = names.length < 2 ? names.join('') : names.slice(0, -1).join(', ')
  const second = names.length < 2 ? '' : names[names.length - 1]
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: `url(${COVER_ART}) center / cover`,
        boxShadow: EDGE,
        borderRadius: 'inherit',
        fontSize: w / 22,
      }}
    >
      {/* The title up the right edge, from near the top; who it is for
          centred on the cover across, and on the title's height. (The title
          sets the box's height: the names are centred in it.) */}
      <div className="absolute inset-x-0 top-[6%] flex">
        {first && (
          <p className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 text-left">
            <span className="font-sans text-forest-deep block text-[0.68em] tracking-[0.25em] uppercase">
              {t('padrinhos.for')}
            </span>
            {/* The welcome screen's colour for names. */}
            <span className="font-script text-title mt-[0.95em] block text-[1.5em] leading-[1.35]">
              <ScriptText>{first}</ScriptText>
            </span>
            {second && (
              <span className="font-script text-title mt-[0.55em] block pl-[1.3em] text-[1.5em] leading-[1.35]">
                {/* (Room after the "&": the script's capitals swash in from the left.) */}
                <span className="mr-[0.35em]">&amp;</span>
                <ScriptText>{second}</ScriptText>
              </span>
            )}
          </p>
        )}
        {/* Read from the foot up, as a spine is. */}
        <span
          className="font-sans text-honey mr-[4.5%] ml-auto text-[0.92em] leading-none font-semibold tracking-[0.3em] whitespace-nowrap uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          {t('padrinhos.cover')}
        </span>
      </div>
    </div>
  )
}

/** A page inside, `h` px tall: the ivory paper, the site's wildflowers at its foot (`mirrored` on the left page, so the two mirror each other). */
function PagePaper({
  h,
  mirrored = false,
  children,
}: {
  h: number
  mirrored?: boolean
  children: ReactNode
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden px-[10%] pt-[12%] text-center"
      style={{
        background: CARD_PAPER,
        boxShadow: EDGE,
        borderRadius: 'inherit',
        fontSize: h / 46,
      }}
    >
      {children}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-[20%] opacity-90 ${mirrored ? '-scale-x-100' : ''}`}
        style={{ background: `url(${BORDER}) center bottom / 160% auto no-repeat` }}
      />
    </div>
  )
}

/** A page's title, in script. */
function PageTitle({ size, children }: { size: string; children: string }) {
  return (
    <h3
      className="font-script text-honey leading-[1.5]"
      style={{ fontSize: size, textShadow: EMBOSS_SHADOW }}
    >
      <ScriptText>{children}</ScriptText>
    </h3>
  )
}

/** The left page: a letter to them (CONFIG.padrinhos.letter). */
export function LetterPage({ lang, h }: { lang: Lang; h: number }) {
  const { letter } = CONFIG.padrinhos
  const pt = lang === 'pt'
  return (
    <PagePaper h={h} mirrored>
      <PageTitle size="1.95em">{pt ? letter.title_pt : letter.title_en}</PageTitle>
      <div className="font-serif text-forest-deep/90 mx-auto mt-[0.8em] max-w-[24em] space-y-[0.8em] text-left text-[1.15em] leading-[1.5] text-pretty">
        {(pt ? letter.paragraphs_pt : letter.paragraphs_en).map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>
    </PagePaper>
  )
}

/**
 * The right page: what to wear, for the madrinhas and for the padrinhos
 * (CONFIG.padrinhos.attire), each with its colours to choose from.
 */
export function AttirePage({ lang, h }: { lang: Lang; h: number }) {
  const pt = lang === 'pt'
  return (
    <PagePaper h={h}>
      {CONFIG.padrinhos.attire.map((group, i) => (
        <section key={i} className={i > 0 ? 'mt-[2.2em]' : ''}>
          <PageTitle size="1.6em">{pt ? group.title_pt : group.title_en}</PageTitle>
          <p className="font-serif text-forest-deep/90 mx-auto mt-[1.1em] max-w-[24em] text-[1.12em] leading-[1.45] text-pretty">
            {pt ? group.text_pt : group.text_en}
          </p>
          {group.palette.length > 0 && (
            <ul className="mt-[1em] flex flex-wrap justify-center gap-[0.7em]">
              {group.palette.map((c, j) => (
                <li key={c} aria-hidden className="h-[2.6em] w-[2.6em]">
                  <WatercolourDab colour={c} seed={i * 7 + j + 1} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </PagePaper>
  )
}

/** `hex` darkened by `k` (0–1), as pigment pooled at a wash's edge. */
function darken(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) =>
    Math.round(v * (1 - k))
      .toString(16)
      .padStart(2, '0')
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`
}

/**
 * A dab of watercolour, not a flat disc: its edge a little wobbly (wet
 * paint spreading on paper; `seed` makes each one different), its middle
 * paler and the pigment pooled darker at its rim, laid on the paper so the
 * paper's grain shows through it (multiply).
 */
function WatercolourDab({ colour, seed }: { colour: string; seed: number }) {
  const id = useId().replace(/:/g, '')
  const rim = darken(colour, 0.22)
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible mix-blend-multiply">
      <defs>
        <filter id={`wc-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          {/* The wobbly edge. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed={seed} />
          <feDisplacementMap
            in="SourceGraphic"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="wash"
          />
          {/* Pigment settling unevenly: a faint blotchy mottle within it. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed={seed + 11} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.55 0.3" />
          <feGaussianBlur stdDeviation="2.2" />
          <feComposite in2="wash" operator="in" result="mottle" />
          <feMerge>
            <feMergeNode in="wash" />
            <feMergeNode in="mottle" />
          </feMerge>
        </filter>
        <radialGradient id={`wg-${id}`} cx="45%" cy="42%" r="58%">
          <stop offset="0%" stopColor={colour} stopOpacity="0.78" />
          <stop offset="68%" stopColor={colour} stopOpacity="0.95" />
          <stop offset="90%" stopColor={rim} stopOpacity="0.95" />
          <stop offset="100%" stopColor={rim} stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill={`url(#wg-${id})`} filter={`url(#wc-${id})`} />
    </svg>
  )
}
