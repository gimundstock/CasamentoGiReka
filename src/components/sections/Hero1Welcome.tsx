import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'

interface Props {
  guest: Guest
}

export function Hero1Welcome({ guest }: Props) {
  const { t } = useTranslation()

  const base = import.meta.env.BASE_URL
  const photoSrc = guest.hasPhoto
    ? `${base}photos/${guest.guestId}.jpg`
    : `${base}photos/couple.jpg`
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`

  return (
    <section
      id="welcome"
      className="bg-peach relative flex min-h-screen w-full flex-col md:flex-row"
    >
      {/* Photo column — left on desktop, top on mobile */}
      <div className="relative w-full md:w-[58%]">
        <div className="h-[55vh] w-full md:h-screen">
          <img
            src={photoSrc}
            alt={altText}
            className="h-full w-full object-cover"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement
              el.style.display = 'none'
            }}
          />
        </div>
      </div>

      {/* Text column — right on desktop, below on mobile */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 md:px-10 md:py-0">
        <div className="relative w-full max-w-xl text-center">
          <img
            src={`${base}flowers/lavender.png`}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-[120%] max-w-none -translate-x-1/2 -translate-y-[55%] opacity-40 select-none"
          />
          <h1 className="font-display text-forest-deep relative z-10 leading-[0.95]">
            <span className="block text-6xl italic sm:text-7xl md:text-8xl lg:text-9xl">
              {CONFIG.couple.bride}
            </span>
            <span className="mt-3 block text-5xl italic sm:text-6xl md:mt-4 md:text-7xl lg:text-8xl">
              <span className="text-mauve font-display mr-3 not-italic">&amp;</span>
              {CONFIG.couple.groom}
            </span>
          </h1>

          <div className="bg-forest-deep/30 relative z-10 mx-auto my-8 h-px w-12 md:my-10" />

          <p className="font-serif text-forest relative z-10 text-2xl italic md:text-3xl lg:text-4xl">
            {t('welcome.greeting', { name: guest.groupName })}
          </p>
          <p className="font-sans text-forest relative z-10 mt-4 text-sm tracking-[0.25em] uppercase">
            {t('welcome.invitation')}
          </p>
        </div>
      </div>

      {/* Scroll cue — bottom-right, static */}
      <div className="absolute right-6 bottom-6 text-center">
        <span className="font-sans text-forest text-[0.55rem] tracking-[0.4em] uppercase">
          SCROLL
        </span>
        <div className="bg-forest-deep/40 mx-auto mt-3 h-12 w-px" />
      </div>
    </section>
  )
}
