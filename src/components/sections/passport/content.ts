import { CONFIG } from '../../../content.config'

/** The chapters, in book order (the tabs follow it). */
export const SECTIONS = ['tourism', 'restaurants', 'transport', 'hotels'] as const
export type SectionKey = (typeof SECTIONS)[number]

/** One recommendation, whatever its kind. */
export interface GuideEntry {
  title: string
  /** Small line under the title (cuisine). */
  meta?: string
  description: string
  address?: string
  price?: string
  href?: string
}

type Lang = 'pt' | 'en'

export function sectionEntries(key: SectionKey, lang: Lang): GuideEntry[] {
  const pt = lang === 'pt'
  const g = CONFIG.cityGuide
  switch (key) {
    case 'tourism':
      return g.tourism.map((p) => ({
        title: p.name,
        description: pt ? p.description_pt : p.description_en,
        address: p.address,
        href: p.url || undefined,
      }))
    case 'restaurants':
      return g.restaurants.map((r) => ({
        title: r.name,
        meta: pt ? r.cuisine_pt : r.cuisine_en,
        description: pt ? r.description_pt : r.description_en,
        address: r.address,
        price: pt ? r.priceRange : r.priceRange_en,
        href: r.url || undefined,
      }))
    case 'transport':
      return g.transport.map((t) => ({
        title: pt ? t.type_pt : t.type_en,
        description: pt ? t.description_pt : t.description_en,
      }))
    case 'hotels':
      return g.hotels.map((h) => ({
        title: h.name,
        description: pt ? h.description_pt : h.description_en,
        address: h.address,
        price: pt ? h.priceRange : h.priceRange_en,
        href: h.url || undefined,
      }))
  }
}

// ── Pages ────────────────────────────────────────────────────────────────

export type PageSpec =
  | { kind: 'inside' }
  | { kind: 'holder' }
  | { kind: 'opener'; section: SectionKey }
  | { kind: 'entries'; section: SectionKey; from: number; to: number }
  | { kind: 'blank' }

/** Entry ranges [from, to) per page, for each chapter. */
export type Chunks = Record<SectionKey, [number, number][]>

export interface Book {
  /** Every page in reading order (the phone view shows these one by one). */
  pages: PageSpec[]
  /** Pages paired into spreads (desktop). */
  spreads: [PageSpec, PageSpec][]
  /** First spread / first page of each chapter. */
  firstSpread: Record<SectionKey, number>
  firstPage: Record<SectionKey, number>
}

/** Lays the chapters out: each opens on a left page, its entries follow. */
export function buildBook(chunks: Chunks): Book {
  // The first spread is the inside of the cover (art only) facing the
  // holder's page. On phones (one page at a time) the inside of the cover
  // comes first, as a page.
  const pages: PageSpec[] = [{ kind: 'inside' }, { kind: 'holder' }]
  const spreads: [PageSpec, PageSpec][] = [[pages[0], pages[1]]]
  const firstSpread = {} as Record<SectionKey, number>
  const firstPage = {} as Record<SectionKey, number>
  for (const section of SECTIONS) {
    const own: PageSpec[] = [
      { kind: 'opener', section },
      ...chunks[section].map(([from, to]) => ({ kind: 'entries' as const, section, from, to })),
    ]
    firstSpread[section] = spreads.length
    firstPage[section] = pages.length
    pages.push(...own)
    for (let i = 0; i < own.length; i += 2) {
      spreads.push([own[i], own[i + 1] ?? { kind: 'blank' }])
    }
  }
  return { pages, spreads, firstSpread, firstPage }
}

/** Chapter a page belongs to (for the tabs). */
export function pageSection(p: PageSpec): SectionKey | null {
  return p.kind === 'opener' || p.kind === 'entries' ? p.section : null
}
