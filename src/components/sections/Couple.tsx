import { useTranslation } from 'react-i18next'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { DrawStem } from '../motion/DrawStem'
import { Bloom } from '../motion/Bloom'
import { ArchMask, Flower, Garland, Petal } from '../botanicals'
import { CONFIG } from '../../content.config'

interface PortraitBlockProps {
  imageSrc: string
  imageAlt: string
  name: string
  role: string
  bio?: string
  delay: number
}

function PortraitBlock({ imageSrc, imageAlt, name, role, bio, delay }: PortraitBlockProps) {
  return (
    <RevealOnScroll delay={delay}>
      <div className="flex flex-col items-center text-center">
        <div className="w-full max-w-[420px]">
          <ArchMask
            imageSrc={imageSrc}
            imageAlt={imageAlt}
            width={420}
            height={500}
            animate
            className="w-full h-auto"
          />
        </div>
        <h3 className="font-display italic text-3xl text-forest-deep mt-6">{name}</h3>
        <p className="font-serif italic text-mauve text-sm mt-1 tracking-wide">{role}</p>
        {bio && (
          <p className="font-serif text-base text-forest/80 leading-relaxed mt-4 max-w-sm">{bio}</p>
        )}
      </div>
    </RevealOnScroll>
  )
}

// A winding vine for the "our story" timeline. Path drawn in a tall
// viewBox so we can place flowers at deterministic y-positions and the
// container height scales with milestone count.
const STORY_VINE_D =
  'M 100 20 C 30 120 170 200 100 300 C 30 400 170 500 100 600 C 30 700 170 800 100 900'

export function Couple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const brideImg = `${import.meta.env.BASE_URL}photos/couple.jpg`
  const groomImg = `${import.meta.env.BASE_URL}photos/couple2.jpg`

  const milestones = CONFIG.story?.milestones ?? []
  const hasStory = milestones.length > 0

  // Evenly distribute milestones along the 920-unit vine path.
  const stepY = milestones.length > 0 ? 880 / (milestones.length + 1) : 0

  return (
    <section id="couple" className="relative bg-peach-light overflow-hidden py-24 md:py-32">
      {/* Watercolor washes */}
      <div className="absolute inset-0 bg-wash-peach opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none" />

      {/* Garland at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(720px,90vw)] opacity-80 pointer-events-none">
        <Garland width={720} height={180} density="sparse" className="w-full h-auto" />
      </div>

      {/* Scattered petals — hidden on mobile to declutter portraits */}
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
      <Petal
        color="#B9A8B5"
        size={20}
        rotation={140}
        className="hidden md:block absolute top-1/2 left-6 opacity-30 animate-float pointer-events-none"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20">
        {/* Heading */}
        <RevealOnScroll>
          <div className="text-center mb-20">
            <p className="font-serif italic text-mauve text-sm tracking-[0.3em] uppercase mb-3">
              {CONFIG.couple.bride} & {CONFIG.couple.groom}
            </p>
            <h2 className="font-display italic text-4xl sm:text-5xl md:text-6xl text-forest-deep">
              {t('couple.title')}
            </h2>
          </div>
        </RevealOnScroll>

        {/* Portraits */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-24">
          <PortraitBlock
            imageSrc={brideImg}
            imageAlt={CONFIG.couple.bride}
            name={CONFIG.couple.bride}
            role={lang === 'pt' ? 'a noiva' : 'the bride'}
            delay={0}
          />
          <PortraitBlock
            imageSrc={groomImg}
            imageAlt={CONFIG.couple.groom}
            name={CONFIG.couple.groom}
            role={lang === 'pt' ? 'o noivo' : 'the groom'}
            delay={0.2}
          />
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
              {/* Winding vine — hidden on small screens where layout stacks */}
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
                  // Approximate the vine x at this point using its meander pattern.
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
                        {/* Card side */}
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

                        {/* Mobile-only flower marker */}
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

                        {/* Spacer that the central vine passes through */}
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
