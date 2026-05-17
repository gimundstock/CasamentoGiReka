import { useTranslation } from 'react-i18next'
import { CONFIG } from '../../content.config'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { Bloom } from '../motion/Bloom'
import { Flower, Petal, VineDivider } from '../botanicals'

interface InfoCardProps {
  label: string
  value: string
  cornerColor: string
  className?: string
  children?: React.ReactNode
}

function InfoCard({ label, value, cornerColor, className, children }: InfoCardProps) {
  return (
    <div
      className={`relative bg-peach-light/85 border border-sage/30 rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(78,120,79,0.06)] overflow-hidden ${
        className ?? ''
      }`}
    >
      <div
        className="absolute inset-0 bg-paper opacity-40 pointer-events-none rounded-2xl"
        aria-hidden
      />

      {/* Tiny filler bloom in a corner — alternates by position via prop */}
      <svg
        className="absolute -top-1 -right-1 w-12 h-12 pointer-events-none"
        viewBox="-20 -20 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <Flower
          cx={0}
          cy={0}
          variant="filler"
          size={0.6}
          color={cornerColor}
          centerColor="#A39584"
          animate={false}
        />
      </svg>

      <div className="relative">
        <p className="font-sans text-xs uppercase tracking-widest text-mauve mb-2">{label}</p>
        <p className="font-display text-2xl md:text-3xl text-forest-deep leading-snug">{value}</p>
        {children}
      </div>
    </div>
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
    <section id="wedding" className="relative overflow-hidden py-24 md:py-32 bg-sage-light/30">
      {/* Watercolor wash + paper grain overlays */}
      <div
        className="absolute inset-0 bg-wash-sage opacity-60 pointer-events-none -z-10"
        aria-hidden
      />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none -z-10" aria-hidden />

      {/* Top vine divider */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" aria-hidden>
        <VineDivider width={1200} height={70} flowerCount={4} className="w-full h-auto" />
      </div>

      {/* Bottom vine divider (rotated) */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none rotate-180" aria-hidden>
        <VineDivider width={1200} height={70} flowerCount={4} className="w-full h-auto" />
      </div>

      {/* Floating petals — hidden on mobile to keep cards uncluttered */}
      <Petal
        size={26}
        color="#C3CBB2"
        rotation={18}
        className="hidden md:block absolute top-32 left-[8%] animate-float opacity-80 pointer-events-none"
      />
      <Petal
        size={20}
        color="#9A7F84"
        rotation={-22}
        className="hidden md:block absolute bottom-40 right-[10%] animate-float opacity-70 pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16">
        {/* Heading */}
        <RevealOnScroll>
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center justify-center gap-3 sm:gap-4 relative">
              <svg
                width="50"
                height="50"
                viewBox="-25 -25 50 50"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 w-10 h-10 sm:w-12 sm:h-12"
                aria-hidden
              >
                <Flower cx={0} cy={0} variant="daisy" size={1} color="#8C7480" />
              </svg>
              <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep">
                {t('wedding.title')}
              </h2>
            </div>
            <p className="font-serif italic text-mauve text-lg md:text-xl mt-6">
              {t('wedding.tagline')}
            </p>
          </div>
        </RevealOnScroll>

        {/* Asymmetric paper cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          <RevealOnScroll delay={0} className="md:col-span-7">
            <InfoCard label={t('wedding.date')} value={dateStr} cornerColor="#8C7480" />
          </RevealOnScroll>

          <RevealOnScroll delay={0.15} className="md:col-span-5 md:translate-y-4">
            <InfoCard label={t('wedding.time')} value={CONFIG.wedding.time} cornerColor="#A39584" />
          </RevealOnScroll>

          <RevealOnScroll delay={0.3} className="md:col-span-6">
            <InfoCard
              label={t('wedding.venue')}
              value={CONFIG.wedding.venue}
              cornerColor="#9A7F84"
            />
          </RevealOnScroll>

          <RevealOnScroll delay={0.45} className="md:col-span-6">
            <InfoCard label={t('wedding.dresscode')} value={dressCode} cornerColor="#AA9DA9" />
          </RevealOnScroll>

          <RevealOnScroll delay={0.6} className="md:col-span-12">
            <InfoCard
              label={t('wedding.address')}
              value={CONFIG.wedding.address}
              cornerColor="#5A7956"
            >
              <div className="mt-6">
                <a
                  href={CONFIG.wedding.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-forest-deep text-peach-light rounded-full px-6 py-2 font-sans text-sm tracking-widest uppercase hover:bg-forest-deep/90 transition-all hover:scale-[1.02]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="-10 -10 30 20"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <Bloom delay={0}>
                      <path
                        d="M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z"
                        fill="#FAF3E3"
                      />
                      <path
                        d="M 1 1 Q 7 0 13 -2"
                        stroke="#3F6041"
                        strokeWidth={0.6}
                        strokeLinecap="round"
                        fill="none"
                        opacity={0.55}
                      />
                    </Bloom>
                  </svg>
                  {t('wedding.directions')}
                </a>
              </div>
            </InfoCard>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
