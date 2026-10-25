import { forwardRef, type CSSProperties, type ReactNode, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../../content.config'
import { ASSETS, PAINT_SRC, type Illustration } from './assets'
import {
  SECTIONS,
  sectionEntries,
  sectionNumber,
  type Book,
  type GuideEntry,
  type PageSpec,
  type SectionKey,
} from './content'

export type Side = 'left' | 'right' | 'single'

/** Hairline gold used for rules and borders. */
export const GOLD = '#C9A464'

/** What a sheet is printed on. */
export type Stock =
  /** Nothing: the page lies on spread.webp, which already has paper, gutter and stack. */
  | 'none'
  /** A loose leaf (paper.webp), with a little shading toward the spine. */
  | 'leaf'
  /** The inside of the cover (cover-inside.webp). */
  | 'inside'

/** Shading toward the spine, so a turning leaf reads as bound in. */
function gutter(side: Side): string {
  const to = side === 'left' ? 'left' : 'right'
  return `linear-gradient(to ${to}, rgba(120, 84, 40, 0.2) 0%, rgba(120, 84, 40, 0.06) 4%, rgba(120, 84, 40, 0) 12%)`
}

/** One sheet. `side` sets which corners are rounded and where the spine shadow falls. */
export const Paper = forwardRef(function Paper(
  {
    side,
    stock,
    children,
  }: {
    side: Side
    stock: Stock
    children?: ReactNode
  },
  ref: Ref<HTMLDivElement>
) {
  const radius = side === 'left' ? '8px 2px 2px 8px' : '2px 8px 8px 2px'
  const background =
    stock === 'leaf'
      ? `url(${ASSETS.paper}) center / cover`
      : stock === 'inside'
        ? `url(${ASSETS.coverInside}) center / 100% 100% no-repeat`
        : undefined
  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      style={{ borderRadius: stock === 'none' ? undefined : radius, background }}
    >
      {stock === 'leaf' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: gutter(side) }}
        />
      )}
      <div className="relative h-full">{children}</div>
    </div>
  )
})

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
        <p className="font-sans text-forest text-[0.58em] tracking-[0.36em] uppercase">
          {t('city.kicker')}
        </p>
      </div>
    </div>
  )
}

/** Inside of the cover: the left page of the first spread. */
export function InsidePage() {
  const { t } = useTranslation()
  const year = new Date(CONFIG.wedding.date).getFullYear()
  return (
    // Kept to the endpaper's clear middle column; its sprigs run down the sides.
    <div className="flex h-full flex-col items-center justify-center px-[24%] pb-[6%] text-center">
      <p className="font-sans text-forest -mr-[0.42em] text-[0.6em] tracking-[0.42em] uppercase">
        {t('city.passport.kicker')}
      </p>
      <h3 className="font-script text-honey mt-[0.4em] text-[2.7em] leading-[1.35]">
        {t('city.passport.title')}
      </h3>
      <Ornament />
      <Vignette
        art={{ src: PAINT_SRC, size: '190% auto', position: '40% 62%', blot: true }}
        className="mt-[1.6em] h-[27%] w-[125%] shrink-0"
      />
      <p className="font-serif text-forest-deep/90 mt-[1.2em] text-[1.08em] leading-[1.35] italic">
        {t('city.passport.insideText')}
      </p>
      <p className="font-sans text-forest mt-[1em] -mr-[0.36em] text-[0.56em] tracking-[0.36em] uppercase">
        {CONFIG.couple.bride} &amp; {CONFIG.couple.groom} · {year}
      </p>
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
      return <InsidePage />
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
