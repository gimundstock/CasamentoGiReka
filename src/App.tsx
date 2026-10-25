import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Nav } from './components/layout/Nav'
import { NameEntry } from './components/sections/NameEntry'
import { Hero1Welcome } from './components/sections/Hero1Welcome'
import { HeroSaveDateCouple } from './components/sections/HeroSaveDateCouple'
import { HeroBigDay } from './components/sections/HeroBigDay'
import { RSVP } from './components/sections/RSVP'
import { GiftShop } from './components/sections/GiftShop'
import { useGuest } from './hooks/useGuest'
import { CONFIG } from './content.config'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-forest-deep text-peach-light py-20 text-center">
      {/* Kerning à mão, como no monograma da nav: o R da fonte cursiva abre
          um vão grande depois do &, então ele é puxado para perto. */}
      {/* mb-8: a perna do R desce bem abaixo da linha de base e cortava a
          linha de baixo. */}
      <p className="font-display text-3xl md:text-4xl mb-8">
        {CONFIG.couple.bride}
        <span className="ml-[0.3em]">&amp;</span>
        <span className="-ml-[0.15em]">{CONFIG.couple.groom}</span>
      </p>
      {/* O tracking deixa um espaço depois da última letra; o -mr o desconta
          para o coração ficar à mesma distância da palavra que as letras
          entre si, e a linha toda no centro. */}
      <p className="font-sans text-[0.65rem] text-peach-light/50 uppercase flex items-center justify-center gap-[0.7em]">
        <span className="tracking-[0.35em] -mr-[0.35em]">{t('footer.made')}</span>
        <span className="animate-breath relative top-[0.1em] inline-block leading-none">♥</span>
      </p>
    </footer>
  )
}

export default function App() {
  const { state, lookupByName, reset } = useGuest()
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language === 'pt' ? 'pt-BR' : 'en'
  }, [i18n.language])

  useEffect(() => {
    document.title = `${CONFIG.couple.bride} & ${CONFIG.couple.groom} — Casamento`
  }, [])

  const guest = state.status === 'found' ? state.guest : null

  if (!guest) {
    return <NameEntry state={state} onSubmit={lookupByName} />
  }

  return (
    <>
      <Nav />
      <main>
        <Hero1Welcome guest={guest} onReset={reset} />
        <HeroSaveDateCouple />
        <HeroBigDay />
        <RSVP guest={guest} />
        <GiftShop guest={guest} />
      </main>
      <Footer />
    </>
  )
}
