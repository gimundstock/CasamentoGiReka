import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useScroll } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MaskReveal } from '../motion/MaskReveal'
import { CathedralArt } from './CathedralArt'
import { CONFIG } from '../../content.config'

type Tab = 'hotels' | 'transport' | 'restaurants' | 'tourism'
const TABS: Tab[] = ['hotels', 'transport', 'restaurants', 'tourism']

function StarRow({ count }: { count: number }) {
  return (
    <span className="font-sans text-xs tracking-widest text-amber" aria-label={`${count} stars`}>
      {'★'.repeat(count)}
    </span>
  )
}

/**
 * One entry, shared by all four tabs. Transport used to render its own way —
 * two columns, an emoji, a smaller heading, no footer — so switching to it felt
 * like landing on a different page.
 *
 * `meta` is the optional right-hand item on the title line (stars, cuisine).
 * The footer row is dropped entirely when an entry has neither address nor
 * value, so transport keeps the shape without showing empty furniture.
 */
function Entry({
  title,
  meta,
  description,
  address,
  value,
  href,
  linkLabel,
}: {
  title: string
  meta?: ReactNode
  description: string
  address?: string
  value?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <article className="border-t border-forest-deep/15 pt-5 md:pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        {/* text-xl matches the card headings in GiftShop — entry names are the
            same size across sections, a step below the section's h2. */}
        <h3 className="font-display text-xl text-title">{title}</h3>
        {meta}
      </div>
      <p className="font-serif text-base text-title leading-relaxed max-w-2xl">{description}</p>
      {(address || value) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-sans text-xs text-title/60">{address}</span>
          {value && <span className="font-sans tabular-nums text-lg text-amber">{value}</span>}
        </div>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-sans text-[0.65rem] tracking-[0.35em] uppercase text-title border-b border-forest-deep/40 pb-1 hover:border-forest-deep transition-colors"
        >
          {linkLabel}
        </a>
      )}
    </article>
  )
}

export function CityGuide() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const [tab, setTab] = useState<Tab>('hotels')

  // Drives the line art's draw-on. Measured against the ART COLUMN, not the
  // section: the art sits well below the section's top, so a section-relative
  // window finishes drawing before the art is even on screen. Here 0 is the
  // art entering from the bottom and 1 is it centred — it draws as you watch.
  const artRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: artRef,
    offset: ['start end', 'center center'],
  })

  // The entries scroll inside their own box, so a tab switch has to rewind it —
  // otherwise the new category opens partway down.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [tab])

  return (
    // On md+ the section is locked to the viewport and the ENTRIES scroll
    // inside their own box, so the art stays put and keeps its centred
    // relationship with the text. Below md that would leave the list around
    // 300px tall, so every height/overflow rule is md:-gated and small screens
    // fall back to ordinary page flow.
    <section id="city" className="bg-peach py-24 md:h-[100svh] md:overflow-hidden md:py-0">
      <div className="max-w-6xl mx-auto px-6 md:h-full md:pt-24 md:pb-12 md:flex md:flex-col">
        <MaskReveal direction="up" delay={0.05} className="md:shrink-0">
          <div className="text-center mb-12 md:mb-10">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-title mb-4">
              {t('city.kicker')}
            </p>
            {/* Deliberately smaller than the text-5xl/md:text-7xl that RSVP and
                GiftShop use. Those sections own a whole scrolling page; this one
                is a fixed-height panel, and at 72px the heading ate the list. */}
            <h2 className="font-display text-2xl md:text-3xl text-title">{t('city.title')}</h2>
            <p className="font-serif text-title text-base md:text-lg mt-4">{t('city.subtitle')}</p>
          </div>
        </MaskReveal>

        <div className="grid md:grid-cols-12 gap-12 md:gap-16 md:flex-1 md:min-h-0">
          {/*
            Art slot — left. On md+ the drawing is deliberately far wider than
            its column and absolutely positioned, so it bleeds right and passes
            BEHIND the entries. The section's overflow-hidden trims whatever
            leaves the panel. It never scrolls, and it is pointer-transparent so
            the overlap cannot swallow clicks on the cards.
          */}
          <div
            ref={artRef}
            className="md:col-span-5 lg:col-span-5 md:h-full md:min-h-0 md:relative"
          >
            <CathedralArt
              progress={scrollYProgress}
              className="w-full h-auto md:absolute md:top-1/2 md:-left-[12%] md:w-[190%] md:max-w-none md:-translate-y-1/2 md:pointer-events-none"
            />
          </div>

          {/* Tabs + scrolling entries — right. z-10 keeps the text above the
              drawing where the two overlap. */}
          <div className="md:col-span-7 lg:col-span-7 md:flex md:flex-col md:min-h-0 md:relative md:z-10">
            <MaskReveal direction="up" delay={0.1} className="md:shrink-0">
              <div className="flex flex-wrap justify-end gap-x-8 gap-y-3 mb-6 border-b border-forest-deep/15 pb-6">
                {TABS.map((tabKey) => {
                  const active = tab === tabKey
                  return (
                    <button
                      key={tabKey}
                      onClick={() => setTab(tabKey)}
                      aria-pressed={active}
                      // The negative margin drops the underline onto the row's
                      // bottom border, which only lines up while the tabs sit
                      // on ONE line. Below md they wrap, so it is md-gated —
                      // otherwise row one's underline lands on row two's text.
                      className={`font-sans text-[0.65rem] tracking-[0.35em] uppercase transition-colors pb-2 md:-mb-[1.625rem] border-b ${
                        active
                          ? 'text-title border-forest-deep'
                          : 'text-title/60 border-transparent hover:text-title'
                      }`}
                    >
                      {t(`city.${tabKey}`)}
                    </button>
                  )
                })}
              </div>
            </MaskReveal>

            {/*
              The scrolling region. `min-h-0` matters: flex items default to
              `min-height: auto`, so without it this box grows to fit its
              content instead of clipping and never scrolls.

              Deliberately no per-entry RevealOnScroll — inside a clipped
              container, `whileInView` observers reason about the ancestor's
              clip, which is the same trap that kept MaskReveal hidden. Inside
              a fixed panel the entries should simply be there.
            */}
            <div
              ref={listRef}
              tabIndex={0}
              role="region"
              aria-label={t('city.listLabel')}
              // pb clears the bottom fade — without it the last entry's final
              // line sits under the gradient and reads as greyed out.
              className="scroll-soft md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-4 md:pb-8"
            >
              <div className="space-y-8 md:space-y-10">
                {tab === 'hotels' &&
                  CONFIG.cityGuide.hotels.map((h, i) => (
                    <Entry
                      key={`hotel-${i}`}
                      title={h.name}
                      meta={<StarRow count={h.stars} />}
                      description={lang === 'pt' ? h.description_pt : h.description_en}
                      address={h.address}
                      value={h.priceRange}
                      href={h.url}
                      linkLabel={lang === 'pt' ? 'Ver hotel' : 'View hotel'}
                    />
                  ))}

                {tab === 'transport' &&
                  CONFIG.cityGuide.transport.map((tr, i) => (
                    <Entry
                      key={`tr-${i}`}
                      title={lang === 'pt' ? tr.type_pt : tr.type_en}
                      description={lang === 'pt' ? tr.description_pt : tr.description_en}
                    />
                  ))}

                {tab === 'restaurants' &&
                  CONFIG.cityGuide.restaurants.map((r, i) => (
                    <Entry
                      key={`r-${i}`}
                      title={r.name}
                      meta={
                        <span className="font-sans text-xs tracking-widest uppercase text-amber">
                          {lang === 'pt' ? r.cuisine_pt : r.cuisine_en}
                        </span>
                      }
                      description={lang === 'pt' ? r.description_pt : r.description_en}
                      address={r.address}
                      value={r.priceRange}
                    />
                  ))}

                {tab === 'tourism' &&
                  CONFIG.cityGuide.tourism.map((place, i) => (
                    <Entry
                      key={`t-${i}`}
                      title={place.name}
                      description={lang === 'pt' ? place.description_pt : place.description_en}
                      address={place.address}
                      href={place.url}
                      linkLabel={lang === 'pt' ? 'Saiba mais' : 'Learn more'}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
