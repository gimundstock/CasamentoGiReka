import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { Bloom } from '../motion/Bloom'
import { Flower, Petal, VineDivider } from '../botanicals'
import { CONFIG } from '../../content.config'

// Tiny golden flower used as a star — a small inline SVG with a filler
// flower so the rating reads as botanical rather than generic.
function FlowerStar() {
  return (
    <svg
      viewBox="-8 -8 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5"
      aria-hidden
    >
      <Flower variant="filler" cx={0} cy={0} color="#DFB100" size={0.6} animate={false} />
    </svg>
  )
}

// Small leaf-like accent to sit next to category headings.
function HeadingLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M 4 18 C 12 4 28 4 36 18"
        stroke="#4E784F"
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      <path d="M 14 14 C 18 8 24 8 28 14 C 24 20 18 20 14 14 Z" fill="#ADB897" opacity={0.9} />
    </svg>
  )
}

// Reusable "paper note" wrapper for all city items.
function PaperNote({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <RevealOnScroll delay={delay}>
      <div
        className={`relative bg-peach-light/85 border border-sage/30 rounded-2xl p-5 shadow-[0_2px_18px_-12px_rgba(63,96,65,0.45)] transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_8px_28px_-14px_rgba(63,96,65,0.55)] ${className}`}
      >
        <div className="absolute inset-0 bg-paper opacity-40 pointer-events-none rounded-2xl" />
        <div className="relative">{children}</div>
      </div>
    </RevealOnScroll>
  )
}

function CategoryHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <HeadingLeaf className="w-8 h-5 -scale-x-100 opacity-80" />
      <h3 className="font-display italic text-3xl text-forest-deep">{children}</h3>
      <HeadingLeaf className="w-8 h-5 opacity-80" />
    </div>
  )
}

function CategoryDivider() {
  return (
    <div className="my-16 flex justify-center">
      <VineDivider width={600} height={50} flowerCount={3} className="mx-auto opacity-60" />
    </div>
  )
}

export function CityGuide() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  return (
    <section id="city" className="relative bg-peach-light overflow-hidden py-24 md:py-32">
      {/* Watercolor washes */}
      <div className="absolute inset-0 bg-wash-mauve opacity-[0.35] pointer-events-none" />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none" />

      {/* Edge petals — hidden on mobile so the paper notes breathe */}
      <Petal
        color="#F7D8BD"
        size={32}
        rotation={-25}
        className="hidden md:block absolute top-24 left-6 opacity-50 animate-float pointer-events-none"
      />
      <Petal
        color="#C98262"
        size={26}
        rotation={40}
        className="hidden md:block absolute top-44 right-10 opacity-40 animate-float pointer-events-none"
      />
      <Petal
        color="#DFB100"
        size={22}
        rotation={15}
        className="hidden md:block absolute bottom-32 left-12 opacity-45 animate-float pointer-events-none"
      />
      <Petal
        color="#AA9DA9"
        size={28}
        rotation={-60}
        className="hidden md:block absolute bottom-20 right-8 opacity-35 animate-float pointer-events-none"
      />
      <Petal
        color="#F5D1B2"
        size={20}
        rotation={120}
        className="hidden md:block absolute top-1/2 left-4 opacity-30 animate-float pointer-events-none"
      />
      <Petal
        color="#C98262"
        size={24}
        rotation={-100}
        className="hidden md:block absolute top-1/3 right-4 opacity-30 animate-float pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <RevealOnScroll>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <svg
                viewBox="-12 -12 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                aria-hidden
              >
                <Bloom>
                  <Flower
                    variant="cosmos"
                    cx={0}
                    cy={0}
                    color="#AA9DA9"
                    centerColor="#DFB100"
                    size={0.6}
                    animate={false}
                  />
                </Bloom>
              </svg>
              <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep">
                {t('city.title')}
              </h2>
              <svg
                viewBox="-12 -12 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                aria-hidden
              >
                <Bloom delay={0.2}>
                  <Flower
                    variant="cosmos"
                    cx={0}
                    cy={0}
                    color="#AA9DA9"
                    centerColor="#DFB100"
                    size={0.6}
                    animate={false}
                  />
                </Bloom>
              </svg>
            </div>
            <p className="font-serif italic text-mauve text-lg md:text-xl">{t('city.subtitle')}</p>
          </div>
        </RevealOnScroll>

        {/* HOTELS */}
        <CategoryHeading>{t('city.hotels')}</CategoryHeading>
        <div className="grid sm:grid-cols-2 gap-6">
          {CONFIG.cityGuide.hotels.map((h, i) => (
            <PaperNote key={`hotel-${i}`} delay={i * 0.05}>
              <div className="flex items-start justify-between mb-3 gap-3">
                <h4 className="font-display text-lg text-forest-deep leading-tight">{h.name}</h4>
                <div className="flex gap-0.5 shrink-0 mt-1">
                  {[...Array(h.stars)].map((_, j) => (
                    <FlowerStar key={j} />
                  ))}
                </div>
              </div>
              <p className="font-serif italic text-sm text-mauve mb-4 leading-relaxed">
                {lang === 'pt' ? h.description_pt : h.description_en}
              </p>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <span className="font-serif italic text-xs text-forest/60">{h.address}</span>
                <span className="font-display text-base text-honey">{h.priceRange}</span>
              </div>
              {h.url && (
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block font-serif italic text-sm text-forest-deep underline underline-offset-4 decoration-sage/70 hover:decoration-forest-deep transition-colors"
                >
                  {lang === 'pt' ? 'Ver hotel →' : 'View hotel →'}
                </a>
              )}
            </PaperNote>
          ))}
        </div>

        <CategoryDivider />

        {/* TRANSPORT */}
        <CategoryHeading>{t('city.transport')}</CategoryHeading>
        <div className="grid sm:grid-cols-3 gap-6">
          {CONFIG.cityGuide.transport.map((tr, i) => (
            <PaperNote key={`tr-${i}`} delay={i * 0.05} className="text-center">
              <div className="text-4xl mb-3" aria-hidden>
                {tr.icon}
              </div>
              <h4 className="font-display text-lg text-forest-deep mb-2">
                {lang === 'pt' ? tr.type_pt : tr.type_en}
              </h4>
              <p className="font-serif italic text-sm text-mauve leading-relaxed">
                {lang === 'pt' ? tr.description_pt : tr.description_en}
              </p>
            </PaperNote>
          ))}
        </div>

        <CategoryDivider />

        {/* RESTAURANTS */}
        <CategoryHeading>{t('city.restaurants')}</CategoryHeading>
        <div className="grid sm:grid-cols-2 gap-6">
          {CONFIG.cityGuide.restaurants.map((r, i) => (
            <PaperNote key={`r-${i}`} delay={i * 0.05}>
              <h4 className="font-display text-lg text-forest-deep mb-1 leading-tight">{r.name}</h4>
              <span className="inline-block font-serif italic text-xs tracking-wide text-honey mb-3">
                {lang === 'pt' ? r.cuisine_pt : r.cuisine_en}
              </span>
              <p className="font-serif italic text-sm text-mauve mb-4 leading-relaxed">
                {lang === 'pt' ? r.description_pt : r.description_en}
              </p>
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <span className="font-serif italic text-xs text-forest/60">{r.address}</span>
                <span className="font-display text-base text-honey">{r.priceRange}</span>
              </div>
            </PaperNote>
          ))}
        </div>

        <CategoryDivider />

        {/* TOURISM */}
        <CategoryHeading>{t('city.tourism')}</CategoryHeading>
        <div className="grid sm:grid-cols-2 gap-6">
          {CONFIG.cityGuide.tourism.map((place, i) => (
            <PaperNote key={`t-${i}`} delay={i * 0.05}>
              <h4 className="font-display text-lg text-forest-deep mb-3 leading-tight">
                {place.name}
              </h4>
              <p className="font-serif italic text-sm text-mauve mb-3 leading-relaxed">
                {lang === 'pt' ? place.description_pt : place.description_en}
              </p>
              <span className="font-serif italic text-xs text-forest/60">{place.address}</span>
              {place.url && (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block font-serif italic text-sm text-forest-deep underline underline-offset-4 decoration-sage/70 hover:decoration-forest-deep transition-colors"
                >
                  {lang === 'pt' ? 'Saiba mais →' : 'Learn more →'}
                </a>
              )}
            </PaperNote>
          ))}
        </div>
      </div>
    </section>
  )
}
