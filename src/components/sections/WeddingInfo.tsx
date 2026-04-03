import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { CONFIG } from '../../content.config'

export function WeddingInfo() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const weddingDate = new Date(CONFIG.wedding.date)
  const dateStr = weddingDate.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const details = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4E784F" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: t('wedding.date'),
      value: dateStr,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4E784F" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t('wedding.time'),
      value: CONFIG.wedding.time,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4E784F" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: t('wedding.venue'),
      value: CONFIG.wedding.venue,
      sub: CONFIG.wedding.address,
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4E784F" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      label: t('wedding.dresscode'),
      value: lang === 'pt' ? CONFIG.wedding.dresscode_pt : CONFIG.wedding.dresscode_en,
    },
  ]

  return (
    <section id="wedding" className="relative bg-sage/20 py-24 overflow-hidden">
      <WildflowerDecor variant="top" className="h-16" opacity={0.3} />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="text-center mb-16">
          <p className="font-sans text-xs tracking-widest uppercase text-amber mb-3">
            {CONFIG.wedding.date.slice(0, 4)}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-forest italic">
            {t('wedding.title')}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-20 h-px bg-sage" />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#ADB897">
              <circle cx="10" cy="10" r="2.5" />
              <circle cx="10" cy="3" r="1.5" />
              <circle cx="17" cy="10" r="1.5" />
              <circle cx="10" cy="17" r="1.5" />
              <circle cx="3" cy="10" r="1.5" />
            </svg>
            <div className="w-20 h-px bg-sage" />
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {details.map((d, i) => (
            <div key={i} className="bg-white/80 rounded-2xl p-6 flex gap-4 items-start">
              <div className="mt-0.5 shrink-0">{d.icon}</div>
              <div>
                <p className="font-sans text-xs tracking-widest uppercase text-mauve mb-1">{d.label}</p>
                <p className="font-serif text-lg text-forest capitalize">{d.value}</p>
                {d.sub && <p className="font-sans text-sm text-mauve mt-1">{d.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Map / directions button */}
        <div className="text-center">
          <a
            href={CONFIG.wedding.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-forest text-forest font-sans text-xs tracking-widest uppercase hover:bg-forest hover:text-peach transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {t('wedding.directions')}
          </a>
        </div>
      </div>

      <WildflowerDecor variant="bottom" className="h-16 mt-8" opacity={0.3} />
    </section>
  )
}
