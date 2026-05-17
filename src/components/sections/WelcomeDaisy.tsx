import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { LetterFlock } from '../motion/LetterFlock'
import { MaskReveal } from '../motion/MaskReveal'
import { useArmedOnScroll } from '../motion/useArmedOnScroll'

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
  const armed = useArmedOnScroll()

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
    <section
      id="welcome"
      className="relative min-h-screen overflow-hidden bg-terracotta flex items-center justify-center px-6 py-20"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Daisy className="w-[150vmin] h-[150vmin] max-w-none" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="absolute -top-4 left-0 sm:-top-8">
          <MaskReveal direction="up" delay={0.1} play={armed}>
            <div className="bg-peach-light text-terracotta px-4 sm:px-6 py-3 sm:py-4">
              <p className="font-sans text-[0.7rem] sm:text-xs tracking-[0.4em] uppercase">
                Save the Date
              </p>
            </div>
          </MaskReveal>
        </div>

        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-end gap-3">
          <MaskReveal direction="left" delay={0.3} play={armed}>
            <span className="block bg-peach-light text-terracotta px-5 sm:px-7 py-2 sm:py-3 font-display italic text-5xl sm:text-7xl md:text-8xl leading-none">
              {day}
            </span>
          </MaskReveal>
          <MaskReveal direction="left" delay={0.5} play={armed}>
            <span className="block bg-forest-deep text-peach-light px-4 sm:px-6 py-2 sm:py-3 font-sans tracking-[0.4em] text-base sm:text-xl">
              {month}
            </span>
          </MaskReveal>
          <MaskReveal direction="left" delay={0.7} play={armed}>
            <span className="block bg-peach-light text-terracotta px-4 sm:px-6 py-1 sm:py-2 font-display italic text-2xl sm:text-3xl">
              {year}
            </span>
          </MaskReveal>
        </div>

        <div className="absolute -bottom-2 left-0 right-0 sm:right-auto">
          <MaskReveal direction="up" delay={0.9} play={armed}>
            <div className="bg-peach-light text-terracotta px-5 sm:px-7 py-3 sm:py-4 inline-block">
              <p className="font-display italic text-2xl sm:text-4xl md:text-5xl leading-none">
                <LetterFlock
                  text={`${CONFIG.couple.bride} & ${CONFIG.couple.groom}`}
                  delay={1.2}
                  stagger={0.04}
                  spreadX={60}
                  spreadY={30}
                  spreadRotate={6}
                  play={armed}
                />
              </p>
            </div>
          </MaskReveal>
        </div>

        <div className="h-[80vh] sm:h-[70vh]" />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <MaskReveal direction="up" delay={1.5} play={armed}>
          <p className="font-sans text-[0.6rem] tracking-[0.4em] uppercase text-peach-light/80">
            {t('welcome.greeting', { name: guest.groupName })}
          </p>
        </MaskReveal>
      </div>
    </section>
  )
}
