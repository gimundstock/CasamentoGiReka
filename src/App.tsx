import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Nav } from './components/layout/Nav'
import { NameEntry } from './components/sections/NameEntry'
import { Hero1Welcome } from './components/sections/Hero1Welcome'
import { HeroSaveDateCouple } from './components/sections/HeroSaveDateCouple'
import { HeroBigDay } from './components/sections/HeroBigDay'
import { WeddingInfo } from './components/sections/WeddingInfo'
import { CityGuide } from './components/sections/CityGuide'
import { RSVP } from './components/sections/RSVP'
import { GiftShop } from './components/sections/GiftShop'
import { useGuest } from './hooks/useGuest'
import { CONFIG } from './content.config'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-forest-deep text-peach-light py-20 text-center">
      <p className="font-display italic text-3xl md:text-4xl mb-3">
        {CONFIG.couple.bride} &amp; {CONFIG.couple.groom}
      </p>
      <p className="font-sans text-[0.65rem] tracking-[0.35em] text-peach-light/50 uppercase">
        {t('footer.made')} <span className="animate-breath inline-block">♥</span>
      </p>
    </footer>
  )
}

export default function App() {
  const { state, lookupByName } = useGuest()
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
        <Hero1Welcome guest={guest} />
        <HeroSaveDateCouple />
        <HeroBigDay />
        <WeddingInfo />
        <CityGuide />
        <RSVP guest={guest} />
        <GiftShop guest={guest} />
      </main>
      <Footer />
    </>
  )
}
