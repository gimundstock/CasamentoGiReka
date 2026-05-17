import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useScroll } from 'framer-motion'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { LetterFlock } from '../motion/LetterFlock'
import { MaskReveal } from '../motion/MaskReveal'

interface Props {
  guest: Guest
}

// Big bold geometric daisy/marigold. Sits still — no auto-rotation.
function Daisy({ className }: { className?: string }) {
  const petals = Array.from({ length: 6 })
  const spikes = Array.from({ length: 48 })

  return (
    <svg
      viewBox="-260 -260 520 520"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {petals.map((_, i) => {
        const angle = (i * 360) / petals.length
        return (
          <g key={`p-${i}`} transform={`rotate(${angle})`}>
            <ellipse cx={0} cy={-150} rx={110} ry={130} fill="#FFF4E8" />
          </g>
        )
      })}

      {spikes.map((_, i) => {
        const angle = (i * 360) / spikes.length
        return (
          <g key={`s-${i}`} transform={`rotate(${angle})`}>
            <path d="M -4 -50 L 0 -200 L 4 -50 Z" fill="#D89A35" />
          </g>
        )
      })}

      {spikes.map((_, i) => {
        const angle = (i * 360) / spikes.length + 360 / spikes.length / 2
        return (
          <g key={`d-${i}`} transform={`rotate(${angle})`}>
            <path d="M -2.5 -28 L 0 -90 L 2.5 -28 Z" fill="#3D3229" />
          </g>
        )
      })}

      <circle cx={0} cy={0} r={30} fill="#FFF4E8" />
    </svg>
  )
}

export function WelcomeDaisy({ guest }: Props) {
  const { t, i18n } = useTranslation()

  // Locked stage — same scroll-pinned pattern as the Saisei hero. The
  // poster stamps itself together across the locked scroll budget.
  const stageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start start', 'end end'],
  })

  const weddingDate = new Date(CONFIG.wedding.date)
  const day = weddingDate.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-GB', {
    day: '2-digit',
  })
  const month = weddingDate
    .toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-GB', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
  const year = weddingDate.toLocaleDateString(i18n.language === 'pt' ? 'pt-BR' : 'en-GB', {
    year: 'numeric',
  })

  return (
    <section id="welcome" className="bg-terracotta relative">
      <div ref={stageRef} className="relative h-[200vh]">
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Daisy className="h-[150vmin] w-[150vmin] max-w-none" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl">
            <div className="absolute -top-4 left-0 sm:-top-8">
              <MaskReveal direction="up" scrollProgress={scrollYProgress} scrollEnd={0.18}>
                <div className="bg-peach-light text-terracotta px-4 py-3 sm:px-6 sm:py-4">
                  <p className="font-sans text-[0.7rem] tracking-[0.4em] uppercase sm:text-xs">
                    Save the Date
                  </p>
                </div>
              </MaskReveal>
            </div>

            <div className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-end gap-3">
              <MaskReveal
                direction="left"
                scrollProgress={scrollYProgress}
                scrollStart={0.15}
                scrollEnd={0.4}
              >
                <span className="bg-peach-light text-terracotta font-display block px-5 py-2 text-5xl leading-none italic sm:px-7 sm:py-3 sm:text-7xl md:text-8xl">
                  {day}
                </span>
              </MaskReveal>
              <MaskReveal
                direction="left"
                scrollProgress={scrollYProgress}
                scrollStart={0.3}
                scrollEnd={0.55}
              >
                <span className="bg-forest-deep text-peach-light font-sans block px-4 py-2 text-base tracking-[0.4em] sm:px-6 sm:py-3 sm:text-xl">
                  {month}
                </span>
              </MaskReveal>
              <MaskReveal
                direction="left"
                scrollProgress={scrollYProgress}
                scrollStart={0.45}
                scrollEnd={0.7}
              >
                <span className="bg-peach-light text-terracotta font-display block px-4 py-1 text-2xl italic sm:px-6 sm:py-2 sm:text-3xl">
                  {year}
                </span>
              </MaskReveal>
            </div>

            <div className="absolute right-0 -bottom-2 left-0 sm:right-auto">
              <MaskReveal
                direction="up"
                scrollProgress={scrollYProgress}
                scrollStart={0.65}
                scrollEnd={0.9}
              >
                <div className="bg-peach-light text-terracotta inline-block px-5 py-3 sm:px-7 sm:py-4">
                  <p className="font-display text-2xl leading-none italic sm:text-4xl md:text-5xl">
                    <LetterFlock
                      text={`${CONFIG.couple.bride} & ${CONFIG.couple.groom}`}
                      scrollProgress={scrollYProgress}
                      scrollSpan={0.3}
                      spreadX={60}
                      spreadY={30}
                      spreadRotate={6}
                    />
                  </p>
                </div>
              </MaskReveal>
            </div>

            <div className="h-[80vh] sm:h-[70vh]" />
          </div>

          <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <MaskReveal
              direction="up"
              scrollProgress={scrollYProgress}
              scrollStart={0.85}
              scrollEnd={1}
            >
              <p className="font-sans text-peach-light/80 text-[0.6rem] tracking-[0.4em] uppercase">
                {t('welcome.greeting', { name: guest.groupName })}
              </p>
            </MaskReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
