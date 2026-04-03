import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { CONFIG } from '../../content.config'

export function Couple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  return (
    <section id="couple" className="relative bg-white py-24 overflow-hidden">
      <WildflowerDecor variant="top" className="h-16" opacity={0.25} />

      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="text-center mb-16">
          <p className="font-sans text-xs tracking-widest uppercase text-amber mb-3">
            {CONFIG.couple.bride} & {CONFIG.couple.groom}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-forest italic">
            {t('couple.title')}
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

        {/* Photo grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-20">
          {['/photos/couple.jpg', '/photos/couple2.jpg', '/photos/couple3.jpg'].map((src, i) => (
            <div
              key={i}
              className={`aspect-[3/4] rounded-2xl overflow-hidden bg-peach ${i === 1 ? 'md:row-span-1 md:aspect-square' : ''}`}
            >
              <img
                src={src}
                alt={`${CONFIG.couple.bride} & ${CONFIG.couple.groom}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  el.style.display = 'none'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story timeline */}
        <div className="text-center mb-10">
          <h3 className="font-serif text-3xl text-forest italic">{t('couple.ourStory')}</h3>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 transform -translate-x-0.5 top-0 bottom-0 w-px bg-sage/40 hidden md:block" />

          <div className="space-y-12">
            {CONFIG.story.milestones.map((m, i) => (
              <div
                key={i}
                className={`relative flex flex-col md:flex-row items-center gap-6 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                  <div className="inline-block bg-peach rounded-2xl px-6 py-5">
                    <span className="font-sans text-xs tracking-widest text-amber uppercase">{m.year}</span>
                    <h4 className="font-serif text-xl text-forest mt-1">
                      {lang === 'pt' ? m.title_pt : m.title_en}
                    </h4>
                    <p className="font-sans text-sm text-mauve mt-2 leading-relaxed">
                      {lang === 'pt' ? m.text_pt : m.text_en}
                    </p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-forest border-4 border-white shadow-sm" />

                {/* Spacer */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <WildflowerDecor variant="bottom" className="h-16 mt-8" opacity={0.25} />
    </section>
  )
}
