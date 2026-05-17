import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Nav } from './components/layout/Nav'
import { BackgroundVine } from './components/layout/BackgroundVine'
import { NameEntry } from './components/sections/NameEntry'
import { Welcome } from './components/sections/Welcome'
import { Couple } from './components/sections/Couple'
import { WeddingInfo } from './components/sections/WeddingInfo'
import { CityGuide } from './components/sections/CityGuide'
import { RSVP } from './components/sections/RSVP'
import { GiftShop } from './components/sections/GiftShop'
import { Petal, VineDivider } from './components/botanicals'
import { PetalDrift } from './components/motion/PetalDrift'
import { useGuest } from './hooks/useGuest'
import { CONFIG } from './content.config'

function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="relative overflow-hidden bg-forest-deep text-peach-light py-14 text-center">
      {/* Paper texture overlay for warmth */}
      <div className="absolute inset-0 bg-paper opacity-[0.15] pointer-events-none" />

      {/* Tiny petal goodbye flourishes */}
      <Petal
        color="#DC8000"
        size={18}
        rotation={-25}
        className="absolute bottom-3 left-[10%] opacity-30 animate-float pointer-events-none"
      />
      <Petal
        color="#DFB100"
        size={16}
        rotation={40}
        className="absolute bottom-6 left-[28%] opacity-30 animate-float pointer-events-none"
      />
      <Petal
        color="#C98262"
        size={20}
        rotation={-60}
        className="absolute bottom-2 right-[30%] opacity-30 animate-float pointer-events-none"
      />
      <Petal
        color="#DC8000"
        size={14}
        rotation={120}
        className="absolute bottom-5 right-[12%] opacity-30 animate-float pointer-events-none"
      />
      <Petal
        color="#DFB100"
        size={18}
        rotation={20}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-30 animate-float pointer-events-none"
      />

      <div className="relative">
        <VineDivider
          width={400}
          height={50}
          flowerCount={3}
          palette={['#DC8000', '#DFB100', '#C98262']}
          className="mx-auto opacity-40 mb-4"
        />
        <p className="font-display italic text-4xl mb-2">
          {CONFIG.couple.bride} & {CONFIG.couple.groom}
        </p>
        <p className="font-sans text-xs tracking-widest text-peach-light/50 uppercase">
          {t('footer.made')} <span className="animate-breath inline-block">♥</span>
        </p>
      </div>
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
      <BackgroundVine />
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
      <PetalDrift count={6} />
    </>
  )
}
