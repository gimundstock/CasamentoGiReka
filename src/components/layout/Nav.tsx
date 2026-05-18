import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import { CONFIG } from '../../content.config'

const sections = ['couple', 'wedding', 'city', 'rsvp', 'gifts'] as const
type SectionId = (typeof sections)[number]

export function Nav() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId
          if ((sections as readonly string[]).includes(id)) {
            setActiveSection(id)
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5] }
    )

    const els: HTMLElement[] = []
    for (const id of sections) {
      const el = document.getElementById(id)
      if (el) {
        observer.observe(el)
        els.push(el)
      }
    }

    return () => {
      for (const el of els) observer.unobserve(el)
      observer.disconnect()
    }
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
        scrolled ? 'bg-peach/90 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display text-forest-deep text-xl italic tracking-wide"
          aria-label="Top"
        >
          {CONFIG.couple.bride[0]} &amp; {CONFIG.couple.groom[0]}
        </button>

        <div className="hidden md:flex items-center gap-10">
          {sections.map((s) => {
            const isActive = activeSection === s
            return (
              <button
                key={s}
                onClick={() => scrollTo(s)}
                className={`font-sans text-[0.65rem] tracking-[0.35em] uppercase transition-colors ${
                  isActive ? 'text-forest-deep' : 'text-forest/60 hover:text-forest-deep'
                }`}
              >
                {t(`nav.${s}`)}
              </button>
            )
          })}
          <LanguageToggle />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <LanguageToggle />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex flex-col gap-1.5 p-1"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span
              className={`bg-forest-deep block h-px w-5 transition-all duration-300 ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`bg-forest-deep block h-px w-5 transition-all duration-300 ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`bg-forest-deep block h-px w-5 transition-all duration-300 ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="bg-peach border-t border-forest-deep/15 md:hidden">
          <div className="flex flex-col gap-5 px-6 py-8">
            {sections.map((s) => {
              const isActive = activeSection === s
              return (
                <button
                  key={s}
                  onClick={() => scrollTo(s)}
                  className={`font-sans text-left text-[0.65rem] tracking-[0.35em] uppercase transition-colors ${
                    isActive ? 'text-forest-deep' : 'text-forest/60 hover:text-forest-deep'
                  }`}
                >
                  {t(`nav.${s}`)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
