import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Nav } from './components/layout/Nav'
import { NameEntry } from './components/sections/NameEntry'
import { Welcome } from './components/sections/Welcome'
import { Couple } from './components/sections/Couple'
import { WeddingInfo } from './components/sections/WeddingInfo'
import { CityGuide } from './components/sections/CityGuide'
import { RSVP } from './components/sections/RSVP'
import { GiftShop } from './components/sections/GiftShop'
import { useGuest } from './hooks/useGuest'
import { CONFIG } from './content.config'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-forest text-peach py-10 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <circle cx="50" cy="50" r="20" fill="#ADB897" />
          <circle cx="350" cy="50" r="20" fill="#ADB897" />
        </svg>
      </div>
      <p className="font-serif text-3xl italic mb-2">
        {CONFIG.couple.bride} & {CONFIG.couple.groom}
      </p>
      <p className="font-sans text-xs tracking-widest text-peach/60 uppercase">
        {t('footer.made')} ♥
      </p>
    </footer>
  )
}

export default function App() {
  const { state, lookupByName } = useGuest()
  const { i18n } = useTranslation()

  // Update <html lang> attribute when language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language === 'pt' ? 'pt-BR' : 'en'
  }, [i18n.language])

  // Update page title
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
        <Welcome guest={guest} />
        <Couple />
        <WeddingInfo />
        <CityGuide />
        <RSVP guest={guest} />
        <GiftShop guest={guest} />
      </main>
      <Footer />
    </>
  )
}
