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
        <div className="w-full max-w-xl text-center">
          <h1 className="font-display text-forest-deep leading-[0.95]">
            <span className="block text-6xl italic sm:text-7xl md:text-8xl lg:text-9xl">
              {CONFIG.couple.bride}
            </span>
            <span className="text-mauve font-display my-4 block text-xl tracking-[0.6em] not-italic sm:text-2xl md:my-6 md:text-3xl">
              &amp;
            </span>
            <span className="block text-6xl italic sm:text-7xl md:text-8xl lg:text-9xl">
              {CONFIG.couple.groom}
            </span>
          </h1>

          <div className="bg-forest-deep/30 mx-auto my-8 h-px w-12 md:my-10" />

          <p className="font-serif text-forest text-lg italic md:text-xl">
            {t('welcome.greeting', { name: guest.groupName })}
          </p>
          <p className="font-sans text-forest mt-4 text-sm tracking-[0.25em] uppercase">
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
