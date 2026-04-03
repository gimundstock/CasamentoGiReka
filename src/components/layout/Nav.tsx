import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import { CONFIG } from '../../content.config'

const sections = ['couple', 'wedding', 'city', 'rsvp', 'gifts'] as const

export function Nav() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-peach/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Monogram */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-serif text-xl text-forest italic tracking-wide"
        >
          {CONFIG.couple.bride[0]} & {CONFIG.couple.groom[0]}
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="font-sans text-xs tracking-widest uppercase text-forest/70 hover:text-forest transition-colors"
            >
              {t(`nav.${s}`)}
            </button>
          ))}
          <LanguageToggle />
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <LanguageToggle />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col gap-1.5 p-1"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-forest transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-forest transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-forest transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-peach/97 border-t border-sage/30 px-6 pb-6 pt-2 flex flex-col gap-4">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="font-sans text-xs tracking-widest uppercase text-forest/70 text-left hover:text-forest transition-colors"
            >
              {t(`nav.${s}`)}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
