import { EMBOSS_SHADOW } from '../../ui/emboss'
import { forwardRef, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { ASSETS, type Illustration } from './assets'
import type { Rect } from './geometry'
import { sectionEntries, type GuideEntry, type PageSpec, type SectionKey } from './content'

/** Which side of the spine a sheet lies on (phones show right-hand pages). */
export type Side = 'left' | 'right'

/** Hairline gold used for rules and borders. */
export const GOLD = '#C9A464'

/** What a sheet is: a page of the book, or the inside of the cover board. */
export type Stock = 'page' | 'board'

/** Cream wash over the paper: stronger where there is small text to read. */
const wash = (a: number) => `linear-gradient(rgba(251, 246, 236, ${a}), rgba(251, 246, 236, ${a}))`
/** The paper (paper2.webp: cream with a faint toile of Brasília). */
export const PAPER_BG = `${wash(0.35)}, url(${ASSETS.paper}) center / cover`
/** The index tabs' paper: the earlier plain paper (paper.webp). */
export const TAB_PAPER = `${wash(0.4)}, url(${ASSETS.tabPaper}) center / cover`
/**
 * Where each page shows the (landscape) paper: varied by page, so facing
 * pages don't repeat the same motifs; fixed per page, so a turning leaf
 * looks like its static self.
 */
const PAPER_SPOTS = ['0% 30%', '62% 70%', '28% 0%', '100% 45%', '45% 100%', '15% 60%', '80% 10%']
/** The paper for page `n`; `busy` washes the watermark further back (lists). */
export function paperFor(n: number, busy: boolean): string {
  return `${wash(busy ? 0.6 : 0.35)}, url(${ASSETS.paper}) ${PAPER_SPOTS[n % PAPER_SPOTS.length]} / cover`
}

/**
 * Outer corners round (--page-r, set on the book so pages nest concentric
 * inside the cover's corners), spine corners nearly square.
 */
export const pageRadius = (side: Side) =>
  side === 'left'
    ? 'var(--page-r, 0.8em) var(--spine-r, 0.15em) var(--spine-r, 0.15em) var(--page-r, 0.8em)'
    : 'var(--spine-r, 0.15em) var(--page-rr, 0.8em) var(--page-rr, 0.8em) var(--spine-r, 0.15em)'

/** Shading toward the spine, so a page reads as bound in. */
function gutter(side: Side): string {
  const to = side === 'left' ? 'left' : 'right'
  return `linear-gradient(to ${to}, rgba(120, 84, 40, 0.16) 0%, rgba(120, 84, 40, 0.05) 3.5%, rgba(120, 84, 40, 0) 10%)`
}

/**
 * One sheet — the ONLY way a page is drawn, lying flat or curling in the
 * flip book, so nothing about it changes when a leaf lifts: same paper,
 * same rounded outer corners, same spine shading, same hairline edge.
 * `stock="board"` is the inside of the cover instead: pure artwork
 * (ASSETS.coverInside), full-bleed, no text.
 */
export const Paper = forwardRef(function Paper(
  {
    side,
    stock = 'page',
    background = PAPER_BG,
    children,
  }: {
    side: Side
    stock?: Stock
    /** The page's paper (see paperFor). */
    background?: string
    children?: ReactNode
  },
  ref: Ref<HTMLDivElement>
) {
  if (stock === 'board') {
    return (
      <div
        ref={ref}
        className="absolute inset-0"
        style={{ background: `url(${ASSETS.coverInside}) center / 100% 100% no-repeat` }}
      >
        {children}
      </div>
    )
  }
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: pageRadius(side),
        background,
        boxShadow: 'inset 0 0 0 0.5px rgba(150, 110, 60, 0.22)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: gutter(side) }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
})

/**
 * One layer of the book under a page: `r` (with outer corner radius `r0`)
 * grown by `d` (a CSS length, so the scroll can drive it through custom
 * properties) on its outer side and bottom only — never at the spine or the
 * top. Its outer corners stay concentric with the box's (radius r0 + d about
 * the same centres), so all the layers' edges run parallel round them.
 */
export function layer(
  r: Rect,
  side: Side,
  d: string,
  r0: number | string,
  spineR: number | string = 0
): CSSProperties {
  const g = (n: number) => `${n.toFixed(2)}px`
  const out = `calc(${typeof r0 === 'number' ? g(r0) : r0} + ${d})`
  const sp = typeof spineR === 'number' ? g(spineR) : spineR
  return {
    left: side === 'right' ? r.x : `calc(${g(r.x)} - ${d})`,
    top: r.y,
    width: `calc(${g(r.w)} + ${d})`,
    height: `calc(${g(r.h)} + ${d})`,
    borderRadius: side === 'right' ? `${sp} ${out} ${out} ${sp}` : `${out} ${sp} ${sp} ${out}`,
  }
}

/** cover-inside.webp's own cream, behind it at the spine corners. */
const BOARD_CREAM = '#F8F1E4'

const STACK_TONES = ['#EADFCB', '#FBF7EF', '#E4D9C3', '#F8F3E8']

/**
 * The page block beside a page: `lines` thin sheets (0–4), each a layer
 * (see `layer`) one `step` (a CSS length) further out, outermost first.
 */
export function PageStack({
  page,
  side,
  lines,
  step,
  r0,
  spineR = 0,
}: {
  page: Rect
  side: Side
  lines: number
  step: string
  r0: number | string
  spineR?: number | string
}) {
  return (
    <>
      {Array.from({ length: lines }, (_, i) => lines - i).map((n) => (
        <div
          key={n}
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            ...layer(page, side, `calc(${step} * ${n})`, r0, spineR),
            background: STACK_TONES[n - 1],
            // Each sheet's edge a hairline darker; the outermost casts a
            // faint shadow onto the board.
            boxShadow:
              n === lines
                ? 'inset 0 0 0 0.5px rgba(150, 115, 65, 0.35), 0 1px 3px rgba(110, 78, 30, 0.22)'
                : 'inset 0 0 0 0.5px rgba(150, 115, 65, 0.3)',
          }}
        />
      ))}
    </>
  )
}

/** Corner radius of the board art, as a fraction of its width: cover-inside.webp (88 / 981). */
export const BOARD_CORNER = 0.09
/** back-inside.webp's corner radius: the same as the front board's (measured ~85 vs 88 / 981). */
export const BACK_CORNER = BOARD_CORNER

/**
 * The inside of the front cover (left of the spine, open): cover-inside.webp
 * exactly as painted — its own rounded outer corners, square at the spine,
 * its turn-in band. No clipping; the shadow follows its shape.
 */
export function InsideBoard({ rect, children }: { rect: Rect; children?: ReactNode }) {
  const r = rect.w * BOARD_CORNER
  return (
    <div className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          borderRadius: `${r}px 0 0 ${r}px`,
          boxShadow: '0 18px 34px -18px rgba(110, 78, 30, calc(0.35 * var(--open, 1)))',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `url(${ASSETS.coverInside}) center / 100% 100% no-repeat` }}
      />
      {children && <div className="relative h-full">{children}</div>}
    </div>
  )
}

/**
 * The inside of the back cover, under the right pages: back-inside.webp, the
 * front inside cover's exact mirror, on the same footprint. Its art shows on the
 * book's last spread; while reading, the page block covers its endpaper.
 * Open, its own shape shows (the clip, at --back-r, matches it); shut, it
 * grows by `d` past the cover and rounds with it (see `layer`), cream
 * filling its corners.
 */
export function BackBoard({ rect, d, spineR }: { rect: Rect; d: string; spineR: number | string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute overflow-hidden"
      style={{
        ...layer(rect, 'right', d, 'var(--back-r)', spineR),
        boxShadow: '0 18px 34px -18px rgba(110, 78, 30, calc(0.35 * var(--open, 1)))',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          // The image box is the board: any art at this path drops in.
          background: `url(${ASSETS.backInside}) center / 100% 100% no-repeat, ${BOARD_CREAM}`,
        }}
      />
    </div>
  )
}

/**
 * The script font (Amsterdam) has no kerning, and its capitals carry a wide
 * advance for their swashes: the next letter starts well clear of the
 * capital's body, so "Pontos" read "P ontos". Each word's capital is pulled
 * in by hand, by how far its body ends short of its advance.
 */
const SCRIPT_KERN: Record<string, string> = {
  P: '-0.26em',
  T: '-0.2em',
  R: '-0.1em',
  F: '-0.14em',
  H: '-0.08em',
  W: '-0.08em',
  S: '-0.04em',
  D: '-0.06em',
  B: '-0.04em',
  G: '-0.06em',
  C: '-0.02em',
  L: '-0.06em',
}

/** Text set in the script font, with each word's capital tucked in (see SCRIPT_KERN). */
export function ScriptText({ children }: { children: string }) {
  return (
    <>
      {children.split(' ').map((word, i) => {
        const cap = word[0]
        const kern = cap ? SCRIPT_KERN[cap] : undefined
        return (
          <span key={i}>
            {i > 0 && ' '}
            {kern ? (
              <>
                <span style={{ marginRight: kern }}>{cap}</span>
                {word.slice(1)}
              </>
            ) : (
              word
            )}
          </span>
        )
      })}
    </>
  )
}

/** A painting crop cut into the watercolor blot (or a cut-out shown as is). */
export function Vignette({ art, className = '' }: { art: Illustration; className?: string }) {
  const mask: CSSProperties = art.blot
    ? {
        maskImage: ASSETS.blotMask,
        WebkitMaskImage: ASSETS.blotMask,
        // contain: the blot keeps its shape whatever box the page leaves it.
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }
    : {}
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          ...mask,
          backgroundImage: `url(${art.src})`,
          backgroundSize: art.size,
          backgroundPosition: art.position,
          backgroundRepeat: 'no-repeat',
          opacity: art.blot ? 0.92 : 1,
        }}
      />
    </div>
  )
}

/** Small running head on every chapter page. */
function RunningHead({ section }: { section: SectionKey }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex items-center justify-between border-b pb-[0.55em]"
      style={{ borderColor: `${GOLD}88` }}
    >
      <span className="font-sans text-[0.6em] tracking-[0.32em] text-forest uppercase">
        {t(`city.passport.sections.${section}.title`)}
      </span>
    </div>
  )
}

function Folio({ n }: { n: number }) {
  return (
    <p className="font-sans text-forest/70 mt-auto pt-[0.6em] text-center text-[0.62em] tracking-[0.2em] tabular-nums">
      {n}
    </p>
  )
}

/** Page padding: sides in % of the page width (tighter on phones), top / bottom in em. */
const PAD = 'px-[7.5%] pt-[2.2em] pb-[1.4em]'

export function EntryItem({ entry }: { entry: GuideEntry }) {
  const { t } = useTranslation()
  return (
    <article className="border-t pt-[0.75em] pb-[0.8em]" style={{ borderColor: `${GOLD}55` }}>
      <h4 className="font-sans text-forest-deep text-[0.95em] leading-tight tracking-[0.03em]">
        {entry.title}
      </h4>
      {entry.meta && (
        <p className="font-sans text-honey mt-[0.4em] text-[0.6em] tracking-[0.24em] uppercase">
          {entry.meta}
        </p>
      )}
      <p className="font-serif text-forest-deep/90 mt-[0.3em] text-[1.1em] leading-[1.3]">
        {entry.description}
      </p>
      {(entry.address || entry.price) && (
        <div className="font-sans text-forest mt-[0.5em] flex flex-wrap items-baseline justify-between gap-x-[1em] text-[0.66em] leading-snug">
          <span>{entry.address}</span>
          {entry.price && <span className="text-honey tabular-nums">{entry.price}</span>}
        </div>
      )}
      {entry.href && (
        <a
          href={entry.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-forest-deep mt-[0.5em] inline-block border-b pb-[0.1em] text-[0.58em] tracking-[0.3em] uppercase"
          style={{ borderColor: GOLD }}
        >
          {t('city.passport.more')}
        </a>
      )}
    </article>
  )
}

/** Frame of a page of entries; `listRef` lets the paginator measure the list box. */
export function EntriesFrame({
  section,
  folio,
  listRef,
  children,
}: {
  section: SectionKey
  folio?: number
  listRef?: Ref<HTMLDivElement>
  children?: ReactNode
}) {
  return (
    <div className={`flex h-full flex-col ${PAD}`}>
      <RunningHead section={section} />
      <div ref={listRef} className="relative min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
      <Folio n={folio ?? 0} />
    </div>
  )
}

function OpenerPage({ section, folio }: { section: SectionKey; folio: number }) {
  const { t } = useTranslation()
  return (
    <div className={`flex h-full flex-col ${PAD}`}>
      <h3
        className="font-script text-honey mt-[2.4em] text-[2.5em] leading-[1.35]"
        style={{ textShadow: EMBOSS_SHADOW }}
      >
        <ScriptText>{t(`city.passport.sections.${section}.title`)}</ScriptText>
      </h3>
      <p className="font-serif text-forest-deep/90 mt-[1.9em] text-[1.15em] leading-[1.38]">
        {t(`city.passport.sections.${section}.intro`)}
      </p>
      <Vignette art={ASSETS.illustrations[section]} className="mt-[1em] min-h-0 flex-1" />
      <Folio n={folio} />
    </div>
  )
}

/**
 * Right-hand page of the first spread, facing the inside of the cover: whose
 * passport it is, and the dedication. Centered, airy, like a passport's
 * holder page.
 */
function HolderPage({ holder }: { holder?: string }) {
  const { t } = useTranslation()
  const year = new Date(CONFIG.wedding.date).getFullYear()
  return (
    <div className="relative flex h-full flex-col items-center px-[13%] pt-[3.2em] pb-[2.6em] text-center">
      {/* A spray of ipê growing in from the outer top corner. */}
      <img
        src={ASSETS.ipeCorner}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute top-0 right-0 w-[44%] opacity-90 select-none"
      />
      <div className="flex flex-1 flex-col items-center justify-center pb-[1.5em]">
        <p className="font-sans text-forest -mr-[0.42em] text-[0.62em] tracking-[0.42em] uppercase">
          {t('city.passport.holder')}
        </p>
        <p
          className="font-script text-honey mt-[0.55em] text-[2.6em] leading-[1.4]"
          style={{ textShadow: EMBOSS_SHADOW }}
        >
          <ScriptText>{holder || t('city.passport.holderFallback')}</ScriptText>
        </p>
        <p className="font-serif text-forest-deep/90 mt-[1.4em] max-w-[18em] text-[1.15em] leading-[1.45] italic">
          {t('city.passport.insideText')}
        </p>
      </div>
      <p className="font-sans text-forest -mr-[0.36em] text-[0.58em] tracking-[0.36em] uppercase">
        {CONFIG.couple.bride} &amp; {CONFIG.couple.groom} · {year}
      </p>
    </div>
  )
}

/** A blank page (end of a chapter with an odd page count, the last page). */
function BlankPage() {
  return null
}

/** The contents of any page in the book. */
export function PageContent({
  spec,
  folio,
  lang,
  holder,
}: {
  spec: PageSpec
  folio: number
  lang: 'pt' | 'en'
  /** Whose passport it is (the guest's group name), if known. */
  holder?: string
}) {
  switch (spec.kind) {
    case 'inside':
    case 'back':
      return null
    case 'holder':
      return <HolderPage holder={holder} />
    case 'opener':
      return <OpenerPage section={spec.section} folio={folio} />
    case 'entries': {
      const entries = sectionEntries(spec.section, lang).slice(spec.from, spec.to)
      return (
        <EntriesFrame section={spec.section} folio={folio}>
          {entries.map((e, i) => (
            <EntryItem key={`${spec.from + i}`} entry={e} />
          ))}
        </EntriesFrame>
      )
    }
    case 'blank':
      return <BlankPage />
  }
}
