import { useTranslation } from 'react-i18next'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { CONFIG } from '../../content.config'

const PHOTOS = ['couple.jpg', 'couple2.jpg', 'couple3.jpg']

export function Couple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const base = import.meta.env.BASE_URL
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`

  const milestones = CONFIG.story?.milestones ?? []
  const hasStory = milestones.length > 0

  return (
    <section id="couple" className="bg-peach py-32 md:py-48">
      <div className="max-w-5xl mx-auto px-6">
        <MaskReveal direction="up" delay={0.05}>
          <div className="text-center mb-24 md:mb-32">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-6">
              {CONFIG.couple.bride} &amp; {CONFIG.couple.groom}
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl text-forest-deep">
              {t('couple.title')}
            </h2>
          </div>
        </MaskReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {PHOTOS.map((file, i) => (
            <MaskReveal key={file} direction="up" delay={i * 0.1}>
              <div
                className={`relative aspect-[3/4] overflow-hidden ${
                  i === 1 ? 'md:aspect-square md:mt-12' : ''
                }`}
              >
                <img
                  src={`${base}photos/${file}`}
                  alt={altText}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
              </div>
            </MaskReveal>
          ))}
        </div>

        {hasStory && (
          <div className="mt-32 md:mt-48">
            <MaskReveal direction="up">
              <h3 className="font-display italic text-3xl md:text-5xl text-forest-deep text-center mb-20 md:mb-28">
                {t('couple.ourStory')}
              </h3>
            </MaskReveal>

            <div className="max-w-2xl mx-auto space-y-20 md:space-y-28">
              {milestones.map((m, i) => (
                <RevealOnScroll key={`milestone-${i}`} delay={i * 0.1}>
                  <div className="text-center">
                    <span className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-amber">
                      {m.year}
                    </span>
                    <h4 className="font-display italic text-2xl md:text-3xl text-forest-deep mt-4">
                      {lang === 'pt' ? m.title_pt : m.title_en}
                    </h4>
                    <p className="font-serif text-base md:text-lg text-forest leading-relaxed mt-5 max-w-xl mx-auto">
                      {lang === 'pt' ? m.text_pt : m.text_en}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
