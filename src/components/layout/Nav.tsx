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
  { observe: 'city', anchor: 'passport', key: 'city' },
  { observe: 'rsvp', anchor: 'rsvp', key: 'rsvp' },
  { observe: 'gifts', anchor: 'gifts', key: 'gifts' },
] as const
type ObserveId = (typeof sections)[number]['observe']

/** Gentle ease-in-out: starts slow, speeds up without rushing, lands slow. */
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

/**
 * Long jumps get more time than short ones so the sections don't fly past,
 * within bounds: ~0.8s for a hop, up to 2.2s from the top to the gifts.
 */
const scrollDuration = (distance: number) =>
  Math.min(2200, Math.max(800, 500 + Math.sqrt(Math.abs(distance)) * 12))

let cancelScroll: (() => void) | null = null

// Module-level so React's purity rule doesn't flag performance.now() —
// this function never runs during render, only in event handlers.
function smoothScrollToY(targetY: number) {
  cancelScroll?.()
  const startY = window.scrollY
  const distance = targetY - startY
  if (Math.abs(distance) < 1) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: targetY, behavior: 'instant' })
    return
  }
  const duration = scrollDuration(distance)
  const startTime = performance.now()
  let frame = 0
  // A wheel, touch or key from the guest takes over at once.
  const stop = () => {
    cancelAnimationFrame(frame)
    for (const ev of ['wheel', 'touchstart', 'keydown'] as const)
      window.removeEventListener(ev, stop)
    cancelScroll = null
  }
  for (const ev of ['wheel', 'touchstart', 'keydown'] as const)
    window.addEventListener(ev, stop, { passive: true })
  cancelScroll = stop
  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    // 'instant': the page sets scroll-behavior: smooth, which would otherwise
    // turn every step into a new native smooth scroll fighting this one.
    window.scrollTo({ top: startY + distance * easeInOutSine(t), behavior: 'instant' })
    if (t < 1) frame = requestAnimationFrame(step)
    else stop()
  }
  frame = requestAnimationFrame(step)
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
    // Custom smooth scroll: native `scrollTo({ behavior: 'smooth' })` gives
    // no control over the curve and makes long jumps (top → big-day anchor
    // several thousand pixels away) take multiple sluggish seconds.
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
          onClick={() => smoothScrollToY(0)}
          className="font-display text-title text-xl"
          aria-label="Top"
        >
          {/* Kerning à mão: o R da fonte cursiva abre um vão grande depois do
              &, então ele é puxado para perto. */}
          {CONFIG.couple.bride[0]}
          <span className="ml-[0.3em]">&amp;</span>
          <span className="-ml-[0.15em]">{CONFIG.couple.groom[0]}</span>
        </button>

        <div className="hidden md:flex items-center gap-10">
          {sections.map((s) => {
            const isActive = activeSection === s.observe
            return (
              <button
                key={s.observe}
                onClick={() => scrollTo(s.anchor)}
                className={`font-sans text-[0.65rem] tracking-[0.35em] uppercase transition-colors ${
                  isActive ? 'text-title' : 'text-title/60 hover:text-title'
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
                    isActive ? 'text-title' : 'text-title/60 hover:text-title'
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
