import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { DrawStem } from '../motion/DrawStem'
import { Bloom } from '../motion/Bloom'
import { ArchMask, Leaf, Flower } from '../botanicals'

interface Props {
  guest: Guest
}

function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    function update() {
      setDiff(new Date(targetDate).getTime() - Date.now())
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const totalSeconds = Math.max(0, Math.floor(diff / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, isPast: diff <= 0 }
}

// Decorative corner garden — stems curl in from top-left and bottom-right,
// with a few leaves and tiny filler blossoms bursting along the curves.
// Drawn on a 1200x800 canvas and stretched to fill the section behind text.
function CornerGarden() {
  const TOP_LEFT_STEM_A = 'M -20 -10 C 80 60 180 140 280 230'
  const TOP_LEFT_STEM_B = 'M -10 40 C 60 110 140 180 250 260'
  const BOTTOM_RIGHT_STEM_A = 'M 1220 810 C 1120 730 1020 660 920 580'
  const BOTTOM_RIGHT_STEM_B = 'M 1210 760 C 1140 690 1060 620 960 550'

  const leaves = [
    { cx: 50, cy: 40, rotation: 35, size: 1.6, variant: 1 as const, delay: 1.4 },
    { cx: 130, cy: 110, rotation: 55, size: 1.5, variant: 3 as const, delay: 1.55 },
    { cx: 210, cy: 180, rotation: 70, size: 1.4, variant: 2 as const, delay: 1.7 },
    { cx: 1150, cy: 760, rotation: -135, size: 1.6, variant: 4 as const, delay: 1.5 },
    { cx: 1070, cy: 690, rotation: -120, size: 1.5, variant: 1 as const, delay: 1.65 },
    { cx: 990, cy: 615, rotation: -110, size: 1.4, variant: 3 as const, delay: 1.8 },
  ]

  const flowers = [
    { cx: 90, cy: 80, variant: 'filler' as const, color: '#DC9A32', size: 1.1, delay: 1.9 },
    { cx: 175, cy: 150, variant: 'daisy' as const, color: '#DFB100', size: 1.2, delay: 2.05 },
    { cx: 260, cy: 240, variant: 'filler' as const, color: '#C98262', size: 1, delay: 2.2 },
    { cx: 1110, cy: 730, variant: 'filler' as const, color: '#DC9A32', size: 1.1, delay: 1.95 },
    { cx: 1030, cy: 655, variant: 'daisy' as const, color: '#DFB100', size: 1.2, delay: 2.1 },
    { cx: 950, cy: 580, variant: 'filler' as const, color: '#C98262', size: 1, delay: 2.25 },
  ]

  return (
    <svg
      viewBox="0 0 1200 800"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      style={{ opacity: 0.65 }}
    >
      <DrawStem d={TOP_LEFT_STEM_A} stroke="#4E784F" strokeWidth={1.4} duration={2.6} delay={0.2} />
      <DrawStem
        d={TOP_LEFT_STEM_B}
        stroke="#3F6041"
        strokeWidth={1.1}
        duration={2.6}
        delay={0.55}
      />
      <DrawStem
        d={BOTTOM_RIGHT_STEM_A}
        stroke="#4E784F"
        strokeWidth={1.4}
        duration={2.6}
        delay={0.4}
      />
      <DrawStem
        d={BOTTOM_RIGHT_STEM_B}
        stroke="#3F6041"
        strokeWidth={1.1}
        duration={2.6}
        delay={0.75}
      />

      {leaves.map((l, i) => (
        <Bloom key={`cg-leaf-${i}`} delay={l.delay}>
          <Leaf
            cx={l.cx}
            cy={l.cy}
            rotation={l.rotation}
            size={l.size}
            variant={l.variant}
            fill="#ADB897"
          />
        </Bloom>
      ))}

      {flowers.map((f, i) => (
        <Flower
          key={`cg-flower-${i}`}
          cx={f.cx}
          cy={f.cy}
          variant={f.variant}
          size={f.size}
          color={f.color}
          delay={f.delay}
        />
      ))}
    </svg>
  )
}

// Tiny corner ornament for the countdown card — a single filler bloom on a
// short curl. Rendered at a small size so the card stays light.
function CardCornerOrnament({ className, rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <path
        d="M 4 36 C 10 26 16 18 26 12"
        stroke="#4E784F"
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Flower cx={26} cy={12} variant="filler" size={0.9} color="#DC9A32" animate={false} />
    </svg>
  )
}

// Botanical scroll cue — a short stem ending in a leaf, breathing softly.
function ScrollHint({ label }: { label: string }) {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-breath"
      aria-label={label}
      role="img"
    >
      <svg
        width="22"
        height="44"
        viewBox="0 0 22 44"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M 11 2 C 14 14 9 24 11 36"
          stroke="#4E784F"
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.55}
        />
        <g transform="translate(11 38) rotate(20)">
          <path
            d="M 0 0 C 3 -5 9 -6 13 -3 C 15 1 11 5 6 5 C 1 5 -1 3 0 0 Z"
            fill="#ADB897"
            opacity={0.85}
          />
        </g>
      </svg>
    </div>
  )
}

export function Welcome({ guest }: Props) {
  const { t } = useTranslation()
  const countdown = useCountdown(CONFIG.wedding.date)
  const base = import.meta.env.BASE_URL
  const photoSrc = guest.hasPhoto
    ? `${base}photos/${guest.guestId}.jpg`
    : `${base}photos/couple.jpg`
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`
  const seatCount = guest.attendees.length

  const countdownItems = [
    { value: countdown.days, label: t('welcome.countdown.days') },
    { value: countdown.hours, label: t('welcome.countdown.hours') },
    { value: countdown.minutes, label: t('welcome.countdown.minutes') },
    { value: countdown.seconds, label: t('welcome.countdown.seconds') },
  ]

  return (
    <section
      id="welcome"
      className="relative min-h-screen bg-peach-light overflow-hidden flex items-center"
    >
      {/* Layered watercolor + paper background */}
      <div className="absolute inset-0 bg-wash-peach opacity-50 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-paper opacity-40 pointer-events-none" aria-hidden />

      {/* Corner garden — stems and blooms draw in behind the headline */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <CornerGarden />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 lg:py-20 grid lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
        {/* Left: copy — 5 of 12 columns, staggered alignment */}
        <div className="order-2 lg:order-1 lg:col-span-5 text-center lg:text-left">
          <RevealOnScroll delay={0} as="div">
            <p className="font-sans text-[0.7rem] tracking-[0.35em] uppercase text-amber mb-6">
              {t('welcome.invitation')}
            </p>
          </RevealOnScroll>

          {/* Couple names — sequentially revealed */}
          <h1 className="text-forest leading-[0.92] mb-8">
            <RevealOnScroll delay={0.2} as="span">
              <span className="block font-display italic text-5xl sm:text-6xl md:text-8xl lg:text-9xl">
                {CONFIG.couple.bride}
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={0.6} as="span">
              <span className="block font-display not-italic text-2xl sm:text-3xl md:text-4xl text-mauve-light tracking-[0.5em] my-3 lg:my-4 lg:pl-6">
                &amp;
              </span>
            </RevealOnScroll>
            <RevealOnScroll delay={0.9} as="span">
              <span className="block font-display italic text-5xl sm:text-6xl md:text-8xl lg:text-9xl lg:pl-10">
                {CONFIG.couple.groom}
              </span>
            </RevealOnScroll>
          </h1>

          {/* Greeting line with hand-drawn flourishes */}
          <RevealOnScroll delay={1.2} as="div">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <svg
                width="56"
                height="10"
                viewBox="0 0 56 10"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className="hidden sm:block text-forest/40 shrink-0"
              >
                <path
                  d="M 2 5 C 14 1 28 9 54 5"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="54" cy="5" r="1.6" fill="#DC9A32" />
              </svg>
              <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-forest/80">
                {t('welcome.greeting', { name: guest.groupName })}
              </p>
              <svg
                width="56"
                height="10"
                viewBox="0 0 56 10"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className="hidden sm:block text-forest/40 shrink-0"
              >
                <path
                  d="M 2 5 C 28 9 42 1 54 5"
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="2" cy="5" r="1.6" fill="#DC9A32" />
              </svg>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={1.35} as="div">
            <p className="font-sans text-xs text-mauve mb-10 tracking-[0.18em]">
              {seatCount === 1
                ? t('welcome.seats', { count: seatCount })
                : t('welcome.seats_plural', { count: seatCount })}
            </p>
          </RevealOnScroll>

          {/* Countdown — paper card with corner blooms */}
          {!countdown.isPast && (
            <RevealOnScroll delay={1.5} as="div">
              <div className="inline-flex flex-col items-center lg:items-start">
                <div className="relative inline-block rounded-2xl border border-sage/30 bg-peach-light/60 shadow-sm px-4 py-5 sm:px-7 sm:py-6 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-paper opacity-40 pointer-events-none rounded-2xl"
                    aria-hidden
                  />

                  {/* Corner ornaments */}
                  <CardCornerOrnament
                    className="absolute -top-2 -left-2 w-8 h-8 opacity-80"
                    rotate={0}
                  />
                  <CardCornerOrnament
                    className="absolute -bottom-2 -right-2 w-8 h-8 opacity-80"
                    rotate={180}
                  />

                  <div className="relative">
                    <p className="font-sans text-[0.6rem] tracking-[0.35em] uppercase text-forest/60 mb-3 text-center lg:text-left">
                      {t('welcome.countdown.title')}
                    </p>
                    <div className="flex items-stretch divide-x divide-sage/30">
                      {countdownItems.map(({ value, label }) => (
                        <div
                          key={label}
                          className="text-center px-2.5 sm:px-4 md:px-5 first:pl-0 last:pr-0"
                        >
                          <div className="font-display text-3xl sm:text-4xl md:text-5xl text-honey tabular-nums leading-none">
                            {String(value).padStart(2, '0')}
                          </div>
                          <div className="font-sans text-[0.55rem] sm:text-[0.6rem] tracking-[0.18em] sm:tracking-[0.22em] text-mauve uppercase mt-2">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          )}
        </div>

        {/* Right: arched photo — 7 of 12 columns, slightly larger */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center lg:justify-end">
          <RevealOnScroll delay={0.4} as="div" className="w-full max-w-[640px]">
            <ArchMask
              imageSrc={photoSrc}
              imageAlt={altText}
              width={600}
              height={440}
              animate
              className="w-full h-auto"
            />
          </RevealOnScroll>
        </div>
      </div>

      <ScrollHint label={t('welcome.scrollDown')} />
    </section>
  )
}
