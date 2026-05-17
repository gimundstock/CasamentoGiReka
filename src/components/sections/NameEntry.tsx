import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import type { GuestState } from '../../hooks/useGuest'
import { CONFIG } from '../../content.config'

const base = import.meta.env.BASE_URL

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-peach px-6">
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      <div className="animate-fade-in w-full max-w-md text-center">
        <img
          src={`${base}flowers/title.png`}
          alt={`${CONFIG.couple.bride} & ${CONFIG.couple.groom}`}
          className="mx-auto mb-12 w-full max-w-xs"
        />

        <h1 className="font-display text-forest-deep mb-4 text-3xl italic">
          {t('nameEntry.welcome')}
        </h1>
        <p className="font-serif text-forest italic mb-10 text-base leading-relaxed">
          {t('nameEntry.subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('nameEntry.placeholder')}
            disabled={isLoading}
            className="font-sans text-forest-deep border-forest-deep/20 placeholder-forest/40 focus:border-forest-deep/60 w-full border-b bg-transparent px-1 py-3 text-center text-base transition-all focus:outline-none disabled:opacity-60"
            autoFocus
          />

          {state.status === 'not_found' && (
            <p className="text-terracotta font-serif italic mt-4 text-sm">
              {t('nameEntry.notFound')}
            </p>
          )}
          {state.status === 'error' && (
            <p className="text-terracotta font-serif italic mt-4 text-sm">{t('nameEntry.error')}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="bg-forest-deep text-peach-light font-sans mt-10 inline-block rounded-none px-12 py-4 text-xs tracking-[0.35em] uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className={isLoading ? 'animate-breath' : ''}>
              {isLoading ? t('nameEntry.loading') : t('nameEntry.button')}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
