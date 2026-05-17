import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { DrawStem } from '../motion/DrawStem'
import { Bloom } from '../motion/Bloom'
import { Flower, Garland, Petal } from '../botanicals'
import { CONFIG } from '../../content.config'

const PHOTOS = ['couple.jpg', 'couple2.jpg', 'couple3.jpg']

// A winding vine for the "our story" timeline. Path drawn in a tall
// viewBox so we can place flowers at deterministic y-positions and the
// container height scales with milestone count.
const STORY_VINE_D =
  'M 100 20 C 30 120 170 200 100 300 C 30 400 170 500 100 600 C 30 700 170 800 100 900'

export function Couple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const base = import.meta.env.BASE_URL
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`

  const milestones = CONFIG.story?.milestones ?? []
  const hasStory = milestones.length > 0
  const stepY = milestones.length > 0 ? 880 / (milestones.length + 1) : 0

  return (
    <section id="couple" className="relative bg-peach-light overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-wash-peach opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(720px,90vw)] opacity-80 pointer-events-none">
        <Garland width={720} height={180} density="sparse" className="w-full h-auto" />
      </div>

      <Petal
        color="#C3CBB2"
        size={30}
        rotation={-20}
        className="hidden md:block absolute top-32 left-8 opacity-50 animate-float pointer-events-none"
      />
      <Petal
        color="#9A7F84"
        size={24}
        rotation={45}
        className="hidden md:block absolute top-1/3 right-10 opacity-40 animate-float pointer-events-none"
      />
      <Petal
        color="#A39584"
        size={22}
        rotation={-50}
        className="hidden md:block absolute bottom-40 left-12 opacity-45 animate-float pointer-events-none"
      />
      <Petal
        color="#AA9DA9"
        size={26}
        rotation={70}
        className="hidden md:block absolute bottom-20 right-16 opacity-35 animate-float pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <p className="font-serif italic text-mauve text-sm tracking-[0.3em] uppercase mb-3">
              {CONFIG.couple.bride} & {CONFIG.couple.groom}
            </p>
            <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep">
              {t('couple.title')}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="w-16 h-px bg-sage/60" />
              <svg viewBox="-10 -10 20 20" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                <Flower
                  variant="filler"
                  cx={0}
                  cy={0}
                  color="#AA9DA9"
                  centerColor="#A39584"
                  size={0.6}
                  animate={false}
                />
              </svg>
              <div className="w-16 h-px bg-sage/60" />
            </div>
          </div>
        </RevealOnScroll>

        {/* Photo grid — 3 photos, middle is square on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-24">
          {PHOTOS.map((file, i) => (
            <RevealOnScroll key={file} delay={i * 0.1}>
              <div
                className={`relative aspect-[3/4] overflow-hidden rounded-2xl border border-sage/30 bg-peach-warm shadow-[0_4px_24px_-12px_rgba(63,96,65,0.45)] ${
                  i === 1 ? 'md:aspect-square' : ''
                }`}
              >
                <img
                  src={`${base}photos/${file}`}
                  alt={altText}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement
                    el.style.display = 'none'
                  }}
                />
              </div>
            </RevealOnScroll>
          ))}
        </div>

        {/* Our Story timeline */}
        {hasStory && (
          <>
            <RevealOnScroll>
              <div className="text-center mb-16">
                <h3 className="font-display italic text-3xl sm:text-4xl md:text-5xl text-forest-deep">
                  {t('couple.ourStory')}
                </h3>
              </div>
            </RevealOnScroll>

            <div className="relative max-w-4xl mx-auto">
              <svg
                viewBox="0 0 200 920"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
                className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 h-full w-32 pointer-events-none"
                aria-hidden
              >
                <DrawStem d={STORY_VINE_D} stroke="#4E784F" strokeWidth={1.6} duration={3.2} />
                <DrawStem
                  d={STORY_VINE_D}
                  stroke="#3F6041"
                  strokeWidth={1}
                  duration={3.2}
                  delay={0.3}
                />
                {milestones.map((_, i) => {
                  const progress = (i + 1) / (milestones.length + 1)
                  const sway = Math.sin(progress * Math.PI * 2.5) * 35
                  const cx = 100 + sway
                  const cy = 20 + stepY * (i + 1)
                  return (
                    <Bloom key={`vine-flower-${i}`} delay={1.2 + i * 0.4}>
                      <Flower
                        cx={cx}
                        cy={cy}
                        variant="daisy"
                        size={1.4}
                        color="#8C7480"
                        centerColor="#A39584"
                        animate={false}
                      />
                    </Bloom>
                  )
                })}
              </svg>

              <div className="space-y-12 md:space-y-20">
                {milestones.map((m, i) => {
                  const isLeft = i % 2 === 0
                  return (
                    <RevealOnScroll key={`milestone-${i}`} delay={i * 0.15}>
                      <div
                        className={`flex flex-col md:flex-row items-center gap-6 ${
                          isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                        }`}
                      >
                        <div
                          className={`flex-1 ${
                            isLeft ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'
                          }`}
                        >
                          <div className="relative inline-block bg-peach-light/85 border border-sage/30 rounded-2xl px-6 py-5 shadow-[0_2px_18px_-12px_rgba(63,96,65,0.45)]">
                            <div className="absolute inset-0 bg-paper opacity-40 pointer-events-none rounded-2xl" />
                            <div className="relative">
                              <span className="font-display italic text-honey text-lg">
                                {m.year}
                              </span>
                              <h4 className="font-display text-xl text-forest-deep mt-1">
                                {lang === 'pt' ? m.title_pt : m.title_en}
                              </h4>
                              <p className="font-serif italic text-sm text-mauve mt-2 leading-relaxed">
                                {lang === 'pt' ? m.text_pt : m.text_en}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="md:hidden">
                          <svg
                            viewBox="-20 -20 40 40"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-10 h-10"
                            aria-hidden
                          >
                            <Flower
                              cx={0}
                              cy={0}
                              variant="daisy"
                              size={1.2}
                              color="#8C7480"
                              centerColor="#A39584"
                              animate={false}
                            />
                          </svg>
                        </div>

                        <div className="hidden md:block flex-1" />
                      </div>
                    </RevealOnScroll>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
