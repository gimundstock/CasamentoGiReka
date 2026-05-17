import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../content.config'
import { MaskReveal } from '../motion/MaskReveal'
import { RevealOnScroll } from '../motion/RevealOnScroll'

interface InfoRowProps {
  label: string
  value: string
  delay?: number
  children?: React.ReactNode
}

function InfoRow({ label, value, delay = 0, children }: InfoRowProps) {
  return (
    <RevealOnScroll delay={delay}>
      <div className="border-t border-forest-deep/15 py-8 md:py-10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest pt-2">
          {label}
        </p>
        <div className="md:col-span-2">
          <p className="font-display text-2xl md:text-3xl text-forest-deep leading-snug">{value}</p>
          {children}
        </div>
      </div>
    </RevealOnScroll>
  )
}

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

  const dressCode = lang === 'pt' ? CONFIG.wedding.dresscode_pt : CONFIG.wedding.dresscode_en

  return (
    <section id="wedding" className="bg-peach py-32 md:py-48">
      <div className="max-w-3xl mx-auto px-6">
        <MaskReveal direction="up" delay={0.05}>
          <div className="text-center mb-20 md:mb-28">
            <p className="font-sans text-[0.65rem] tracking-[0.4em] uppercase text-forest mb-6">
              {t('wedding.ceremony')}
            </p>
            <h2 className="font-display italic text-5xl md:text-7xl text-forest-deep">
              {t('wedding.title')}
            </h2>
            <p className="font-serif italic text-mauve text-lg md:text-xl mt-6">
              {t('wedding.tagline')}
            </p>
          </div>
        </MaskReveal>

        <div className="border-b border-forest-deep/15">
          <InfoRow label={t('wedding.date')} value={dateStr} delay={0.05} />
          <InfoRow label={t('wedding.time')} value={CONFIG.wedding.time} delay={0.1} />
          <InfoRow label={t('wedding.venue')} value={CONFIG.wedding.venue} delay={0.15} />
          <InfoRow label={t('wedding.dresscode')} value={dressCode} delay={0.2} />
          <InfoRow label={t('wedding.address')} value={CONFIG.wedding.address} delay={0.25}>
            <a
              href={CONFIG.wedding.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-5 font-sans text-xs tracking-[0.35em] uppercase text-forest-deep border-b border-forest-deep/40 pb-1 hover:border-forest-deep transition-colors"
            >
              {t('wedding.directions')}
            </a>
          </InfoRow>
        </div>
      </div>
    </section>
  )
}
