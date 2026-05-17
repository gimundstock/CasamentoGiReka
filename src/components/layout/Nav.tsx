import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import { CONFIG } from '../../content.config'
import { Flower, VineDivider } from '../botanicals'

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
        // Choose the entry closest to the top that is currently intersecting.
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
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5] },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'px-4 pt-3' : 'px-0 pt-0'
      }`}
    >
      <div
        className={`relative mx-auto transition-all duration-500 ${
          scrolled
            ? 'max-w-5xl rounded-2xl border border-sage/30 bg-peach-light/95 shadow-sm backdrop-blur-sm'
            : 'max-w-6xl border border-transparent bg-transparent'
        }`}
      >
        {/* Paper texture overlay (only when scrolled) */}
        {scrolled && (
          <div
            className="bg-paper pointer-events-none absolute inset-0 rounded-2xl opacity-40"
            aria-hidden
          />
        )}

        <div className="relative flex items-center justify-between px-6 py-3">
          {/* Monogram */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group font-display text-forest relative flex items-center gap-2 text-2xl italic tracking-wide"
            aria-label="Top"
          >
            <span>
              {CONFIG.couple.bride[0]} &amp; {CONFIG.couple.groom[0]}
            </span>
            <span
              className="inline-flex h-4 w-4 items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            >
              <svg width="14" height="14" viewBox="-8 -8 16 16" aria-hidden>
                <Flower
                  cx={0}
                  cy={0}
                  variant="filler"
                  size={0.5}
                  color="#DC8000"
                  centerColor="#DFB100"
                  animate={false}
                />
              </svg>
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-7 md:flex">
            {sections.map((s) => {
              const isActive = activeSection === s
              return (
                <button
                  key={s}
                  onClick={() => scrollTo(s)}
                  className={`font-sans relative text-xs tracking-widest uppercase transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-0 after:bg-forest/40 after:transition-all after:duration-500 hover:after:w-full ${
                    isActive ? 'text-forest font-medium' : 'text-forest/70 hover:text-forest'
                  }`}
                >
                  {isActive && (
                    <span
                      className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2"
                      aria-hidden
                    >
                      <svg width="10" height="10" viewBox="-6 -6 12 12" aria-hidden>
                        <Flower
                          cx={0}
                          cy={0}
                          variant="filler"
                          size={0.4}
                          color="#DC8000"
                          centerColor="#DFB100"
                          animate={false}
                        />
                      </svg>
                    </span>
                  )}
                  {t(`nav.${s}`)}
                </button>
              )
            })}
            <LanguageToggle />
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageToggle />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex flex-col gap-1.5 p-1"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <span
                className={`bg-forest-deep block h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`bg-forest-deep block h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`bg-forest-deep block h-0.5 w-5 transition-all duration-300 ${
                  menuOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="bg-peach-light/97 border-sage/30 relative overflow-hidden rounded-b-2xl border-t md:hidden">
            <div
              className="bg-paper pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
            />
            <div className="relative flex justify-center pt-1 opacity-60" aria-hidden>
              <VineDivider width={220} height={30} flowerCount={2} />
            </div>
            <div className="relative flex flex-col gap-4 px-6 pt-1 pb-6">
              {sections.map((s) => {
                const isActive = activeSection === s
                return (
                  <button
                    key={s}
                    onClick={() => scrollTo(s)}
                    className={`font-sans text-left text-xs tracking-widest uppercase transition-colors ${
                      isActive ? 'text-forest font-medium' : 'text-forest/70 hover:text-forest'
                    }`}
                  >
                    {t(`nav.${s}`)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
