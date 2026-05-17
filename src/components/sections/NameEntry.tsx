import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import type { GuestState } from '../../hooks/useGuest'
import { CONFIG } from '../../content.config'
import { Garland, Petal, Flower, VineDivider } from '../botanicals'

interface Props {
  state: GuestState
  onSubmit: (name: string) => void
}

// Deterministic, hand-placed petals scattered around the card.
// Each petal gets a distinct delay/duration so the bobbing never feels synchronized.
const FLOATING_PETALS: Array<{
  left: string
  top: string
  rotation: number
  color: string
  size: number
  delay: string
  duration: string
}> = [
  {
    left: '8%',
    top: '22%',
    rotation: -18,
    color: '#F7D8BD',
    size: 14,
    delay: '0s',
    duration: '6s',
  },
  {
    left: '18%',
    top: '68%',
    rotation: 32,
    color: '#C98262',
    size: 11,
    delay: '1.2s',
    duration: '7s',
  },
  {
    left: '30%',
    top: '32%',
    rotation: 12,
    color: '#FAE6D4',
    size: 13,
    delay: '0.6s',
    duration: '5.5s',
  },
  {
    left: '72%',
    top: '20%',
    rotation: -28,
    color: '#F7D8BD',
    size: 12,
    delay: '1.8s',
    duration: '6.5s',
  },
  {
    left: '82%',
    top: '60%',
    rotation: 24,
    color: '#DC9A32',
    size: 10,
    delay: '0.9s',
    duration: '7.2s',
  },
  {
    left: '64%',
    top: '78%',
    rotation: -8,
    color: '#F7D8BD',
    size: 13,
    delay: '2.4s',
    duration: '6.8s',
  },
  {
    left: '12%',
    top: '50%',
    rotation: 48,
    color: '#FAE6D4',
    size: 11,
    delay: '1.5s',
    duration: '5.8s',
  },
]

export function NameEntry({ state, onSubmit }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim()) onSubmit(name.trim())
  }

  const isLoading = state.status === 'loading'

  return (
    <div className="bg-peach-light relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Layered background washes */}
      <div className="bg-wash-peach pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="bg-paper pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      {/* Garland top */}
      <div className="pointer-events-none absolute top-0 right-0 left-0" aria-hidden>
        <Garland
          density="medium"
          width={1200}
          height={140}
          className="mx-auto block w-full opacity-60"
        />
      </div>

      {/* Garland bottom (rotated) */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 rotate-180" aria-hidden>
        <Garland
          density="medium"
          width={1200}
          height={140}
          className="mx-auto block w-full opacity-60"
        />
      </div>

      {/* Scattered floating petals */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {FLOATING_PETALS.map((p, i) => (
          <div
            key={i}
            className="animate-float absolute"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          >
            <Petal color={p.color} size={p.size} rotation={p.rotation} />
          </div>
        ))}
      </div>

      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      {/* Paper letter card */}
      <div className="animate-fade-in relative z-10 w-full max-w-md">
        <div className="border-sage/30 bg-peach-light/80 relative rounded-3xl border p-10 shadow-[0_4px_30px_rgba(78,120,79,0.08)] md:p-12">
          {/* Paper texture overlay */}
          <div
            className="bg-paper pointer-events-none absolute inset-0 rounded-3xl opacity-50"
            aria-hidden
          />

          {/* Corner flowers peeking past the edge */}
          <div className="pointer-events-none absolute -top-4 -left-4 h-10 w-10" aria-hidden>
            <svg width="40" height="40" viewBox="-20 -20 40 40" aria-hidden>
              <Flower
                cx={0}
                cy={0}
                variant="filler"
                size={1.6}
                color="#C98262"
                centerColor="#DFB100"
                animate={false}
              />
            </svg>
          </div>
          <div className="pointer-events-none absolute -top-4 -right-4 h-10 w-10" aria-hidden>
            <svg width="40" height="40" viewBox="-20 -20 40 40" aria-hidden>
              <Flower
                cx={0}
                cy={0}
                variant="filler"
                size={1.6}
                color="#DC8000"
                centerColor="#DFB100"
                animate={false}
              />
            </svg>
          </div>

          <div className="relative text-center">
            {/* Monogram */}
            <div className="font-display text-forest animate-fade-in mb-2 text-6xl italic">
              {CONFIG.couple.bride[0]} &amp; {CONFIG.couple.groom[0]}
            </div>
            <div className="font-serif text-forest/60 animate-fade-in mb-10 text-lg italic">
              {CONFIG.couple.bride} &amp; {CONFIG.couple.groom}
            </div>

            <h1 className="font-serif text-forest animate-slide-up mb-3 text-2xl">
              {t('nameEntry.welcome')}
            </h1>
            <p className="font-sans text-mauve animate-slide-up mb-8 text-sm leading-relaxed">
              {t('nameEntry.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="animate-slide-up">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('nameEntry.placeholder')}
                disabled={isLoading}
                className="font-sans text-forest border-sage/40 placeholder-mauve/50 focus:ring-forest/20 w-full rounded-full border bg-white/80 px-5 py-3.5 text-center transition-all focus:bg-white focus:ring-2 focus:outline-none disabled:opacity-60"
                autoFocus
              />

              {state.status === 'not_found' && (
                <p className="text-amber font-sans mt-3 text-sm">{t('nameEntry.notFound')}</p>
              )}
              {state.status === 'error' && (
                <p className="text-amber font-sans mt-3 text-sm">{t('nameEntry.error')}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="group bg-forest-deep hover:bg-forest-deep/90 text-peach-light font-sans mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm tracking-widest uppercase transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={isLoading ? 'animate-breath' : ''}>
                  {isLoading ? t('nameEntry.loading') : t('nameEntry.button')}
                </span>
                <span
                  className="inline-flex h-3 w-3 items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                >
                  <svg width="12" height="12" viewBox="-2 -8 20 16" aria-hidden>
                    <path
                      d="M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z"
                      fill="#FAE6D4"
                    />
                    <path
                      d="M 1 1 Q 7 0 13 -2"
                      stroke="#3F6041"
                      strokeWidth={0.4}
                      strokeLinecap="round"
                      fill="none"
                      opacity={0.45}
                    />
                  </svg>
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Decorative vine divider near the bottom */}
      <div
        className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 opacity-40"
        aria-hidden
      >
        <VineDivider width={300} height={40} flowerCount={3} />
      </div>
    </div>
  )
}
