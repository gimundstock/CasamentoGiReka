import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { CONFIG } from '../../content.config'

type Tab = 'hotels' | 'transport' | 'restaurants'

export function CityGuide() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const [tab, setTab] = useState<Tab>('hotels')

  const tabs: Tab[] = ['hotels', 'transport', 'restaurants']

  return (
    <section id="city" className="relative bg-white py-24 overflow-hidden">
      <WildflowerDecor variant="top" className="h-16" opacity={0.2} />

      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="text-center mb-12">
          <p className="font-sans text-xs tracking-widest uppercase text-amber mb-3">Brasil</p>
          <h2 className="font-serif text-4xl md:text-5xl text-forest italic">{t('city.title')}</h2>
          <p className="font-sans text-sm text-mauve mt-3">{t('city.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {tabs.map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-5 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-colors ${
                tab === tabKey
                  ? 'bg-forest text-peach'
                  : 'border border-forest/30 text-forest/60 hover:border-forest/60 hover:text-forest'
              }`}
            >
              {t(`city.${tabKey}`)}
            </button>
          ))}
        </div>

        {/* Hotels */}
        {tab === 'hotels' && (
          <div className="grid sm:grid-cols-2 gap-6">
            {CONFIG.cityGuide.hotels.map((h, i) => (
              <div key={i} className="bg-peach/50 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif text-xl text-forest">{h.name}</h3>
                  <div className="flex gap-0.5 ml-2 shrink-0">
                    {[...Array(h.stars)].map((_, j) => (
                      <svg key={j} className="w-3.5 h-3.5" fill="#DFB100" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="font-sans text-sm text-mauve mb-3 leading-relaxed">
                  {lang === 'pt' ? h.description_pt : h.description_en}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-forest/60">{h.address}</span>
                  <span className="font-sans text-xs font-semibold text-amber">
                    {h.priceRange}
                  </span>
                </div>
                {h.url && (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-sans text-xs text-forest underline underline-offset-2"
                  >
                    Ver hotel →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Transport */}
        {tab === 'transport' && (
          <div className="grid sm:grid-cols-3 gap-6">
            {CONFIG.cityGuide.transport.map((tr, i) => (
              <div key={i} className="bg-sage/20 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-4">{tr.icon}</div>
                <h3 className="font-serif text-lg text-forest mb-3">
                  {lang === 'pt' ? tr.type_pt : tr.type_en}
                </h3>
                <p className="font-sans text-sm text-mauve leading-relaxed">
                  {lang === 'pt' ? tr.description_pt : tr.description_en}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Restaurants */}
        {tab === 'restaurants' && (
          <div className="grid sm:grid-cols-2 gap-6">
            {CONFIG.cityGuide.restaurants.map((r, i) => (
              <div key={i} className="bg-peach/50 rounded-2xl p-6">
                <h3 className="font-serif text-xl text-forest mb-1">{r.name}</h3>
                <span className="inline-block font-sans text-xs tracking-wide uppercase text-amber mb-3">
                  {lang === 'pt' ? r.cuisine_pt : r.cuisine_en}
                </span>
                <p className="font-sans text-sm text-mauve mb-3 leading-relaxed">
                  {lang === 'pt' ? r.description_pt : r.description_en}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs text-forest/60">{r.address}</span>
                  <span className="font-sans text-xs font-semibold text-amber">{r.priceRange}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <WildflowerDecor variant="bottom" className="h-16 mt-8" opacity={0.2} />
    </section>
  )
}
