import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import type { GuestState } from '../../hooks/useGuest'

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-peach px-6 pb-24 md:pb-40">
      <div className="absolute top-6 right-6 z-20">
        <LanguageToggle />
      </div>

      <div className="relative w-full max-w-md text-center">
        {/* Lavanda escondida temporariamente. Para trazer de volta, descomente
            este bloco.
        <img
          src={`${base}flowers/lavender.png`}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 z-0 w-[130%] max-w-none -translate-x-1/2 -translate-y-[20%] opacity-40 select-none"
        />
        */}
        <h1 className="font-display text-title relative z-10 text-6xl leading-[1.25]">
          {t('nameEntry.welcome')}
        </h1>
        <p className="font-serif text-title relative z-10 mt-24 text-base font-medium leading-relaxed">
          {t('nameEntry.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="relative z-10">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('nameEntry.placeholder')}
            disabled={isLoading}
            className="font-garamond text-title border-forest-deep/20 placeholder-title/40 focus:border-forest-deep/60 w-full border-b bg-transparent px-1 pt-3 pb-0.5 text-center text-base transition-all focus:outline-none disabled:opacity-60"
            autoFocus
          />

          {state.status === 'not_found' && (
            <p className="text-terracotta font-serif mt-4 text-sm">{t('nameEntry.notFound')}</p>
          )}
          {state.status === 'error' && (
            <p className="text-terracotta font-serif mt-4 text-sm">{t('nameEntry.error')}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="bg-cta text-peach-light font-sans mt-10 inline-block rounded-none px-12 py-4 text-xs tracking-[0.35em] uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-75"
          >
            <span className={isLoading ? 'animate-breath' : ''}>
              {isLoading ? t('nameEntry.loading') : t('nameEntry.button')}
            </span>
          </button>
        </form>
      </div>

      {/* Faixa de flores do campo apoiada na base da tela. O fundo da imagem
          é transparente, então ela assenta direto sobre o pêssego. No celular
          ela ganha altura fixa e corta as laterais para não ficar fina demais. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-[5px] z-0 h-40 md:aspect-[2000/477] md:h-auto"
      >
        <img
          src={`${base}flowers/wildflower_border.webp`}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full max-w-none object-cover object-bottom select-none"
        />
      </div>
    </div>
  )
}
