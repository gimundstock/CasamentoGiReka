import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'
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

  return (
    <section id="city" className="bg-peach py-32 md:py-48">
      <div className="max-w-4xl mx-auto px-6">
        <MaskReveal direction="up" delay={0.05}>
          <div className="text-center mb-16 md:mb-20">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-6">
              Brasília
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl text-forest-deep">
              {t('city.title')}
            </h2>
            <p className="font-serif italic text-mauve text-lg md:text-xl mt-6">
              {t('city.subtitle')}
            </p>
          </div>
        </MaskReveal>

        {/* Tabs */}
        <MaskReveal direction="up" delay={0.1}>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mb-16 md:mb-20 border-b border-forest-deep/15 pb-6">
            {TABS.map((tabKey) => {
              const active = tab === tabKey
              return (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  aria-pressed={active}
                  className={`font-sans text-[0.65rem] tracking-[0.35em] uppercase transition-colors pb-2 -mb-[1.625rem] border-b ${
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

        {tab === 'hotels' && (
          <div className="space-y-12 md:space-y-16">
            {CONFIG.cityGuide.hotels.map((h, i) => (
              <RevealOnScroll key={`hotel-${i}`} delay={i * 0.05}>
                <article className="border-t border-forest-deep/15 pt-8 md:pt-10">
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
              </RevealOnScroll>
            ))}
          </div>
        )}

        {tab === 'transport' && (
          <div className="grid sm:grid-cols-2 gap-12 md:gap-16">
            {CONFIG.cityGuide.transport.map((tr, i) => (
              <RevealOnScroll key={`tr-${i}`} delay={i * 0.05}>
                <article className="border-t border-forest-deep/15 pt-8 md:pt-10">
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
              </RevealOnScroll>
            ))}
          </div>
        )}

        {tab === 'restaurants' && (
          <div className="space-y-12 md:space-y-16">
            {CONFIG.cityGuide.restaurants.map((r, i) => (
              <RevealOnScroll key={`r-${i}`} delay={i * 0.05}>
                <article className="border-t border-forest-deep/15 pt-8 md:pt-10">
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
              </RevealOnScroll>
            ))}
          </div>
        )}

        {tab === 'tourism' && (
          <div className="space-y-12 md:space-y-16">
            {CONFIG.cityGuide.tourism.map((place, i) => (
              <RevealOnScroll key={`t-${i}`} delay={i * 0.05}>
                <article className="border-t border-forest-deep/15 pt-8 md:pt-10">
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
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
