import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useScroll, useTransform } from 'framer-motion'
import { CONFIG } from '../../content.config'
import { Daisy } from '../botanicals/Daisy'
import { MaskReveal } from '../motion/MaskReveal'
import { RisingCard } from '../motion/RisingCard'
import { ZoomMorph } from '../motion/ZoomMorph'

/**
 * Hero 3 — "Meet the Couple".
 *
 * Scroll-pinned stage (400vh outer, sticky inner). A spinning daisy sits
 * as a backdrop while a cascade of couple photos + story milestones rises
 * up through the viewport. Over the final stretch the daisy zooms to fill
 * the screen, leaving a clean cream field for the next section.
 *
 * Scroll choreography (progress 0 → 1):
 *   0.00 → 0.08  heading mask-reveals
 *   0.10 → 0.70  photo cascade (per-card sub-ranges, see math below)
 *   0.00 → 0.70  daisy spins 0° → 360°
 *   0.70 → 1.00  daisy zoom-morph fills viewport (scale 1 → 6)
 */
export function Hero3MeetCouple() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'

  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  // Daisy spins through most of the cascade, then locks while it zooms.
  const daisyRotate = useTransform(scrollYProgress, [0, 0.7], [0, 360])

  const milestones = CONFIG.story?.milestones ?? []
  const N = milestones.length

  // Cascade math — distribute N cards over scroll [0.1, 0.7].
  //   cascadeWindow = 0.6
  //   perCard       = cascadeWindow / N
  //   riseSpan      = perCard * 1.6  (overlap so 1–2 cards visible at once)
  //   card i: scrollStart = 0.1 + i * perCard, scrollEnd = scrollStart + riseSpan
  const cascadeStart = 0.1
  const cascadeWindow = 0.6
  const perCard = N > 0 ? cascadeWindow / N : cascadeWindow
  const riseSpan = perCard * 1.6

  return (
    <section id="couple" className="relative bg-peach">
      <div ref={stageRef} className="relative h-[400vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Layer 1 — Section heading */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-6 pt-16 text-center md:pt-20">
            <MaskReveal
              direction="up"
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.08}
            >
              <p className="font-sans text-forest mb-4 text-[0.65rem] tracking-[0.4em] uppercase">
                {t('couple.ourStory')}
              </p>
            </MaskReveal>
            <MaskReveal
              direction="up"
              scrollProgress={scrollYProgress}
              scrollStart={0}
              scrollEnd={0.08}
            >
              <h2 className="font-display text-forest-deep text-3xl italic md:text-5xl">
                {t('couple.title')}
              </h2>
            </MaskReveal>
          </div>

          {/* Layer 2 — Spinning daisy backdrop + final zoom morph */}
          <ZoomMorph
            scrollProgress={scrollYProgress}
            scrollStart={0.7}
            scrollEnd={1}
            scaleFrom={1}
            scaleTo={6}
          >
            <Daisy className="h-[80vmin] w-[80vmin]" rotate={daisyRotate} />
          </ZoomMorph>

          {/* Layer 3 — Photo + milestone cascade */}
          <div className="absolute inset-0 z-10">
            {milestones.map((m, i) => {
              const scrollStart = cascadeStart + i * perCard
              const scrollEnd = scrollStart + riseSpan
              const captionSide: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left'
              const imageSrc = `${import.meta.env.BASE_URL}photos/${m.photo}`
              const title = lang === 'pt' ? m.title_pt : m.title_en
              const text = lang === 'pt' ? m.text_pt : m.text_en

              return (
                <RisingCard
                  key={`milestone-${i}`}
                  scrollProgress={scrollYProgress}
                  scrollStart={scrollStart}
                  scrollEnd={scrollEnd}
                  imageSrc={imageSrc}
                  imageAlt={title}
                  captionSide={captionSide}
                  photoWidthClass="max-w-md"
                  caption={
                    <div>
                      <div className="font-display text-forest-deep text-5xl leading-none italic md:text-7xl">
                        {m.year}
                      </div>
                      <div className="font-display text-forest-deep mt-3 text-2xl italic md:text-3xl">
                        {title}
                      </div>
                      <div className="font-serif text-forest mt-4 max-w-md text-base leading-relaxed italic md:text-lg">
                        {text}
                      </div>
                    </div>
                  }
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
