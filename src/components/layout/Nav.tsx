import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../ui/LanguageToggle'
import { CONFIG } from '../../content.config'

// Each nav item carries three ids:
//   observe — the outer section element the IntersectionObserver watches
//             to highlight the active link
//   anchor  — the element the click scrolls to; for the two long pinned
//             heroes this is an inner anchor placed mid-stage so the user
//             lands at the "fully shown" moment, not at the very start
//             of the animation
//   key     — i18n key under `nav.*`
const sections = [
  { observe: 'couple', anchor: 'save-the-date', key: 'saveTheDate' },
  { observe: 'wedding', anchor: 'big-day', key: 'wedding' },
  { observe: 'city', anchor: 'city', key: 'city' },
  { observe: 'rsvp', anchor: 'rsvp', key: 'rsvp' },
  { observe: 'gifts', anchor: 'gifts', key: 'gifts' },
] as const
type ObserveId = (typeof sections)[number]['observe']

// Module-level so React's purity rule doesn't flag performance.now() —
// this function never runs during render, only in event handlers.
function smoothScrollToY(targetY: number, duration = 1300) {
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 1) return
  const startTime = performance.now()
  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    window.scrollTo(0, startY + distance * eased)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export function Nav() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<ObserveId | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observeIds = sections.map((s) => s.observe) as readonly string[]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.id
          if (observeIds.includes(id)) {
            setActiveSection(id as ObserveId)
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5] }
    )

    const els: HTMLElement[] = []
    for (const id of observeIds) {
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
    const el = document.getElementById(id)
    if (!el) return
    // Custom smooth scroll with a FIXED duration. Native `scrollTo({
    // behavior: 'smooth' })` scales its duration with distance, which
    // makes long jumps (top → big-day anchor several thousand pixels
    // away) take multiple sluggish seconds.
    const targetY = window.scrollY + el.getBoundingClientRect().top
    smoothScrollToY(targetY)
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
            const isActive = activeSection === s.observe
            return (
              <button
                key={s.observe}
                onClick={() => scrollTo(s.anchor)}
                className={`font-sans text-[0.65rem] tracking-[0.35em] uppercase transition-colors ${
                  isActive ? 'text-forest-deep' : 'text-forest/60 hover:text-forest-deep'
                }`}
              >
                {t(`nav.${s.key}`)}
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
              const isActive = activeSection === s.observe
              return (
                <button
                  key={s.observe}
                  onClick={() => scrollTo(s.anchor)}
                  className={`font-sans text-left text-[0.65rem] tracking-[0.35em] uppercase transition-colors ${
                    isActive ? 'text-forest-deep' : 'text-forest/60 hover:text-forest-deep'
                  }`}
                >
                  {t(`nav.${s.key}`)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
