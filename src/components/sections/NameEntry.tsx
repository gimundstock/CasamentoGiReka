import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { LanguageToggle } from '../ui/LanguageToggle'
import type { GuestState } from '../../hooks/useGuest'
import { CONFIG } from '../../content.config'

interface Props {
  state: GuestState
  onSubmit: (name: string) => void
}

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
    <div className="min-h-screen bg-peach flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Decorative wildflowers */}
      <WildflowerDecor variant="top" className="h-32" opacity={0.3} />
      <WildflowerDecor variant="bottom" className="h-32" opacity={0.3} />

      {/* Floating petals */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + (i % 3)}s`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <ellipse cx="8" cy="4" rx="4" ry="2.5" fill="#ADB897" opacity="0.5" />
              <ellipse cx="12" cy="8" rx="4" ry="2.5" fill="#ADB897" opacity="0.5" transform="rotate(90 12 8)" />
              <ellipse cx="8" cy="12" rx="4" ry="2.5" fill="#ADB897" opacity="0.5" transform="rotate(180 8 12)" />
              <ellipse cx="4" cy="8" rx="4" ry="2.5" fill="#ADB897" opacity="0.5" transform="rotate(270 4 8)" />
            </svg>
          </div>
        ))}
      </div>

      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Monogram */}
        <div className="font-serif text-5xl text-forest italic mb-2 animate-fade-in">
          {CONFIG.couple.bride[0]} & {CONFIG.couple.groom[0]}
        </div>
        <div className="font-serif text-lg text-forest/60 mb-10 animate-fade-in">
          {CONFIG.couple.bride} & {CONFIG.couple.groom}
        </div>

        <h1 className="font-serif text-2xl text-forest mb-3 animate-slide-up">
          {t('nameEntry.welcome')}
        </h1>
        <p className="font-sans text-sm text-mauve mb-8 animate-slide-up leading-relaxed">
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
            className="w-full px-5 py-3.5 rounded-full border border-sage/50 bg-white/70 font-sans text-forest placeholder-mauve/50 text-center focus:outline-none focus:border-forest/60 focus:bg-white transition-all disabled:opacity-60"
            autoFocus
          />

          {state.status === 'not_found' && (
            <p className="mt-3 text-sm text-amber font-sans">{t('nameEntry.notFound')}</p>
          )}
          {state.status === 'error' && (
            <p className="mt-3 text-sm text-amber font-sans">{t('nameEntry.error')}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="mt-5 w-full py-3.5 rounded-full bg-forest text-peach font-sans text-sm tracking-widest uppercase hover:bg-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('nameEntry.loading') : t('nameEntry.button')}
          </button>
        </form>
      </div>

      {/* Small decorative divider */}
      <div className="absolute bottom-20 flex items-center gap-3 opacity-30">
        <div className="w-16 h-px bg-sage" />
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#4E784F">
          <circle cx="10" cy="10" r="2" />
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
          <circle cx="4" cy="10" r="1.5" />
        </svg>
        <div className="w-16 h-px bg-sage" />
      </div>
    </div>
  )
}
