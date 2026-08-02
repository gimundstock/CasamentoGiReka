import { useEffect, useRef, useState } from 'react'
import { useScroll } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { MaskReveal } from '../motion/MaskReveal'
import { BrasiliaLineArt } from './BrasiliaLineArt'
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
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-4">
              Brasília
            </p>
            <h2 className="font-display italic text-4xl md:text-5xl text-forest-deep">
              {t('city.title')}
            </h2>
            <p className="font-serif italic text-mauve text-base md:text-lg mt-4">
              {t('city.subtitle')}
            </p>
          </div>
        </MaskReveal>

        <div className="grid md:grid-cols-12 gap-12 md:gap-16 md:flex-1 md:min-h-0">
          {/* Art slot — left. Centred in the column and never scrolls. */}
          <div
            ref={artRef}
            className="md:col-span-5 lg:col-span-5 md:h-full md:flex md:items-center md:justify-center md:min-h-0"
          >
            <BrasiliaLineArt progress={scrollYProgress} />
          </div>

          {/* Tabs + scrolling entries — right */}
          <div className="md:col-span-7 lg:col-span-7 md:flex md:flex-col md:min-h-0">
            <MaskReveal direction="up" delay={0.1} className="md:shrink-0">
              <div className="flex flex-wrap justify-end gap-x-8 gap-y-3 mb-8 border-b border-forest-deep/15 pb-6">
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
                          ? 'text-forest-deep border-forest-deep'
                          : 'text-forest/60 border-transparent hover:text-forest-deep'
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
              {tab === 'hotels' && (
                <div className="space-y-12 md:space-y-16">
                  {CONFIG.cityGuide.hotels.map((h, i) => (
                    <article
                      key={`hotel-${i}`}
                      className="border-t border-forest-deep/15 pt-8 md:pt-10"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                        <h3 className="font-display italic text-2xl md:text-3xl text-forest-deep">
                          {h.name}
                        </h3>
                        <StarRow count={h.stars} />
                      </div>
                      <p className="font-serif italic text-base text-forest leading-relaxed max-w-2xl">
                        {lang === 'pt' ? h.description_pt : h.description_en}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="font-sans text-xs text-forest/60">{h.address}</span>
                        <span className="font-display text-lg text-amber">{h.priceRange}</span>
                      </div>
                      {h.url && (
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block font-sans text-[0.65rem] tracking-[0.35em] uppercase text-forest-deep border-b border-forest-deep/40 pb-1 hover:border-forest-deep transition-colors"
                        >
                          {lang === 'pt' ? 'Ver hotel' : 'View hotel'}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              )}

              {tab === 'transport' && (
                <div className="grid sm:grid-cols-2 gap-12 md:gap-16">
                  {CONFIG.cityGuide.transport.map((tr, i) => (
                    <article
                      key={`tr-${i}`}
                      className="border-t border-forest-deep/15 pt-8 md:pt-10"
                    >
                      <div className="text-2xl mb-4" aria-hidden>
                        {tr.icon}
                      </div>
                      <h3 className="font-display italic text-xl text-forest-deep mb-3">
                        {lang === 'pt' ? tr.type_pt : tr.type_en}
                      </h3>
                      <p className="font-serif italic text-base text-forest leading-relaxed">
                        {lang === 'pt' ? tr.description_pt : tr.description_en}
                      </p>
                    </article>
                  ))}
                </div>
              )}

              {tab === 'restaurants' && (
                <div className="space-y-12 md:space-y-16">
                  {CONFIG.cityGuide.restaurants.map((r, i) => (
                    <article
                      key={`r-${i}`}
                      className="border-t border-forest-deep/15 pt-8 md:pt-10"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
                        <h3 className="font-display italic text-2xl md:text-3xl text-forest-deep">
                          {r.name}
                        </h3>
                        <span className="font-sans text-xs tracking-widest uppercase text-amber">
                          {lang === 'pt' ? r.cuisine_pt : r.cuisine_en}
                        </span>
                      </div>
                      <p className="font-serif italic text-base text-forest leading-relaxed max-w-2xl">
                        {lang === 'pt' ? r.description_pt : r.description_en}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="font-sans text-xs text-forest/60">{r.address}</span>
                        <span className="font-display text-lg text-amber">{r.priceRange}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {tab === 'tourism' && (
                <div className="space-y-12 md:space-y-16">
                  {CONFIG.cityGuide.tourism.map((place, i) => (
                    <article
                      key={`t-${i}`}
                      className="border-t border-forest-deep/15 pt-8 md:pt-10"
                    >
                      <h3 className="font-display italic text-2xl md:text-3xl text-forest-deep mb-3">
                        {place.name}
                      </h3>
                      <p className="font-serif italic text-base text-forest leading-relaxed max-w-2xl">
                        {lang === 'pt' ? place.description_pt : place.description_en}
                      </p>
                      <span className="mt-4 block font-sans text-xs text-forest/60">
                        {place.address}
                      </span>
                      {place.url && (
                        <a
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block font-sans text-[0.65rem] tracking-[0.35em] uppercase text-forest-deep border-b border-forest-deep/40 pb-1 hover:border-forest-deep transition-colors"
                        >
                          {lang === 'pt' ? 'Saiba mais' : 'Learn more'}
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
