import { forwardRef, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { ASSETS, type Illustration } from './assets'
import {
  SECTIONS,
  sectionEntries,
  sectionNumber,
  type Book,
  type GuideEntry,
  type PageSpec,
  type SectionKey,
} from './content'

/** Which side of the spine a sheet lies on (phones show right-hand pages). */
export type Side = 'left' | 'right'

/** Hairline gold used for rules and borders. */
export const GOLD = '#C9A464'

/** What a sheet is: a page of the book, or the inside of the cover board. */
export type Stock = 'page' | 'board'

const PAPER_WASH = 'rgba(252, 248, 240, 0.4)'

/** Outer corners round, spine corners nearly square. */
export const pageRadius = (side: Side) =>
  side === 'left' ? '0.8em 0.15em 0.15em 0.8em' : '0.15em 0.8em 0.8em 0.15em'

/** Shading toward the spine, so a page reads as bound in. */
function gutter(side: Side): string {
  const to = side === 'left' ? 'left' : 'right'
  return `linear-gradient(to ${to}, rgba(120, 84, 40, 0.16) 0%, rgba(120, 84, 40, 0.05) 3.5%, rgba(120, 84, 40, 0) 10%)`
}

/**
 * One sheet — the ONLY way a page is drawn, lying flat or curling in the
 * flip book, so nothing about it changes when a leaf lifts: same paper,
 * same rounded outer corners, same spine shading, same hairline edge.
 * `stock="board"` is the inside of the cover instead: a gold rule and one
 * sprig, which sits bottom-left in the art — the outer corner once the
 * cover lies open.
 */
export const Paper = forwardRef(function Paper(
  {
    side,
    stock = 'page',
    children,
  }: {
    side: Side
    stock?: Stock
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
        // A wash of cream over paper.webp keeps its grain fine at desktop size.
        background: `linear-gradient(${PAPER_WASH}, ${PAPER_WASH}), url(${ASSETS.paper}) center / cover`,
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
 * The page block's edge along a page's outer side: `lines` thin sheets
 * (0–4), each a hairline further out and a touch lower. Put on a box the
 * size of the page, under it.
 */
export function pageStack(side: Side, lines: number, k: number): CSSProperties {
  const d = side === 'left' ? -1 : 1
  const u = Math.max(0.8, Math.min(1.4, k * 1.6))
  const tones = ['#EADFCB', '#FAF5EB', '#E3D7C0', '#F7F1E5']
  return {
    borderRadius: pageRadius(side),
    background: '#F7F0E3',
    boxShadow:
      lines > 0
        ? tones
            .slice(0, lines)
            .map(
              (c, i) =>
                `${(d * (i + 1) * u).toFixed(1)}px ${((i + 1) * 0.6 * u).toFixed(1)}px 0 ${c}`
            )
            .join(', ')
        : 'none',
  }
}

/**
 * The back board under the pages: the same light board as the cover,
 * offset a few px down and right so that, closed, it and the page block
 * show as the book's thickness past the cover's edge.
 */
export function BackBoard({ style, k }: { style: CSSProperties; k: number }) {
  const t = Math.max(2, 5 * k)
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        ...style,
        transform: `translate(${t.toFixed(1)}px, ${t.toFixed(1)}px)`,
        borderRadius: '0.25em 0.9em 0.9em 0.25em',
        background: 'linear-gradient(160deg, #F5EEDF 0%, #EEE3CE 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(190, 150, 80, 0.55), 0 18px 34px -18px rgba(110, 78, 30, 0.4)',
      }}
    />
  )
}

/** Inside of the front cover: whose passport it is, and the dedication. */
export function InsideCover({ holder }: { holder?: string }) {
  const { t } = useTranslation()
  const year = new Date(CONFIG.wedding.date).getFullYear()
  return (
    <div className="flex h-full flex-col items-center px-[16%] pt-[22%] pb-[8%] text-center">
      <p className="font-sans text-forest -mr-[0.42em] text-[0.6em] tracking-[0.42em] uppercase">
        {t('city.passport.holder')}
      </p>
      <p className="font-script text-honey mt-[0.5em] text-[2.2em] leading-[1.4]">
        {holder || t('city.passport.holderFallback')}
      </p>
      <Ornament className="mt-[0.3em]" />
      <p className="font-serif text-forest-deep/90 mt-[1.6em] text-[1.08em] leading-[1.4] italic">
        {t('city.passport.insideText')}
      </p>
      <p className="font-sans text-forest mt-[1.2em] -mr-[0.36em] text-[0.56em] tracking-[0.36em] uppercase">
        {CONFIG.couple.bride} &amp; {CONFIG.couple.groom} · {year}
      </p>
    </div>
  )
}

/** Four-point star, the passport's little ornament. */
export function Star({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} style={style}>
      <path
        fill="currentColor"
        d="M12 0C12.8 7.4 16.6 11.2 24 12 16.6 12.8 12.8 16.6 12 24 11.2 16.6 7.4 12.8 0 12 7.4 11.2 11.2 7.4 12 0Z"
      />
    </svg>
  )
}

/** A short gold rule with the star in the middle. */
function Ornament({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-[0.7em] ${className}`} aria-hidden>
      <span className="h-px w-[3.2em]" style={{ background: GOLD }} />
      <Star className="h-[0.75em] w-[0.75em]" style={{ color: GOLD }} />
      <span className="h-px w-[3.2em]" style={{ background: GOLD }} />
    </div>
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
          opacity: art.blot ? 0.92 : 0.85,
        }}
      />
      {art.overlay && (
        <img
          src={art.overlay}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute right-[2%] bottom-[8%] w-[46%] opacity-80 select-none"
        />
      )}
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
        {sectionNumber(section)} · {t(`city.passport.sections.${section}.title`)}
      </span>
      <Star className="h-[0.7em] w-[0.7em]" style={{ color: GOLD }} />
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
      <div className="flex items-baseline justify-between gap-[0.8em]">
        <h4 className="font-sans text-forest-deep text-[0.95em] leading-tight tracking-[0.03em]">
          {entry.title}
        </h4>
        {entry.stars ? (
          <span
            className="text-honey shrink-0 text-[0.7em] tracking-[0.15em]"
            aria-label={`${entry.stars} ${t('city.stars')}`}
          >
            {'★'.repeat(entry.stars)}
          </span>
        ) : null}
      </div>
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
      <p
        className="font-sans text-[3.4em] leading-none font-extralight tracking-[0.04em]"
        style={{ color: GOLD }}
      >
        {sectionNumber(section)}
      </p>
      <h3 className="font-script text-honey mt-[0.15em] text-[2.5em] leading-[1.35]">
        {t(`city.passport.sections.${section}.title`)}
      </h3>
      <Ornament className="mt-[0.2em] !justify-start" />
      <p className="font-serif text-forest-deep/90 mt-[1em] text-[1.15em] leading-[1.38]">
        {t(`city.passport.sections.${section}.intro`)}
      </p>
      <Vignette art={ASSETS.illustrations[section]} className="mt-[1em] min-h-0 flex-1" />
      <Folio n={folio} />
    </div>
  )
}

function IndexPage({ book, onGo }: { book: Book; onGo?: (s: SectionKey) => void }) {
  const { t } = useTranslation()
  return (
    <div className={`flex h-full flex-col ${PAD}`}>
      <p className="font-sans text-forest -mr-[0.42em] text-center text-[0.6em] tracking-[0.42em] uppercase">
        {t('city.passport.kicker')} {t('city.passport.title')}
      </p>
      <h3 className="font-script text-honey mt-[0.6em] text-center text-[2.6em] leading-[1.35]">
        {t('city.passport.indexTitle')}
      </h3>
      <Ornament className="mt-[0.1em]" />
      <ol className="mt-[1.8em] flex flex-col gap-[0.4em]">
        {SECTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onGo?.(s)}
              tabIndex={onGo ? 0 : -1}
              className="group flex w-full items-baseline gap-[0.8em] py-[0.55em] text-left"
            >
              <span className="font-sans text-[0.8em] tabular-nums" style={{ color: GOLD }}>
                {sectionNumber(s)}
              </span>
              <span className="font-serif text-forest-deep group-hover:text-honey text-[1.35em] transition-colors">
                {t(`city.passport.sections.${s}.title`)}
              </span>
              <span
                aria-hidden
                className="mb-[0.3em] flex-1 border-b border-dotted"
                style={{ borderColor: `${GOLD}aa` }}
              />
              <span className="font-sans text-forest text-[0.75em] tabular-nums">
                {book.firstPage[s] + 1}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-col items-center gap-[0.6em] pt-[1em]">
        <Star className="h-[1em] w-[1em]" style={{ color: GOLD }} />
        <p className="font-sans text-forest -mr-[0.36em] text-[0.56em] tracking-[0.36em] uppercase">
          {t('city.kicker')}
        </p>
      </div>
    </div>
  )
}

/** A decorative blank page (end of a chapter with an odd page count). */
function BlankPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <Star className="h-[1.2em] w-[1.2em] opacity-60" style={{ color: GOLD }} />
    </div>
  )
}

/** The contents of any page in the book. */
export function PageContent({
  spec,
  book,
  folio,
  lang,
  onGo,
}: {
  spec: PageSpec
  book: Book
  folio: number
  lang: 'pt' | 'en'
  onGo?: (s: SectionKey) => void
}) {
  switch (spec.kind) {
    case 'inside':
      return null
    case 'index':
      return <IndexPage book={book} onGo={onGo} />
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
