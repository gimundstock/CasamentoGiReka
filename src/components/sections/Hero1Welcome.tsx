import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'
import { PhotoCarousel, type CarouselPhoto } from '../ui/PhotoCarousel'

interface Props {
  guest: Guest
  /** Limpa o convidado salvo e volta para a tela de nome. */
  onReset: () => void
}

export function Hero1Welcome({ guest, onReset }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const base = import.meta.env.BASE_URL
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`

  // A foto do convidado, quando existe, abre o carrossel — era ela que
  // aparecia sozinha aqui antes, e a personalização não pode se perder.
  // Os marcos da história trazem legenda; as demais entram sem texto.
  const photos: CarouselPhoto[] = [
    ...(guest.hasPhoto
      ? [{ src: `${base}photos/${guest.guestId}.jpg`, alt: guest.groupName }]
      : []),
    ...CONFIG.story.milestones.map((m) => ({
      src: `${base}photos/${m.photo}`,
      alt: altText,
      caption: lang === 'pt' ? m.title_pt : m.title_en,
    })),
    { src: `${base}photos/r01.jpg`, alt: altText },
    { src: `${base}photos/r02.jpg`, alt: altText },
  ]

  return (
    <section
      id="welcome"
      className="bg-peach relative flex min-h-screen w-full flex-col md:flex-row"
    >
      {/* Photo column — left on desktop, top on mobile */}
      <div className="relative w-full md:w-[58%]">
        <div className="h-[55vh] w-full md:h-screen">
          <PhotoCarousel photos={photos} />
        </div>
      </div>

      {/* Text column — right on desktop, below on mobile */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 md:px-10 md:py-0">
        <div className="relative w-full max-w-xl text-center">
          {/* Lavanda escondida temporariamente — descomente para trazer de volta.
          <img
            src={`${base}flowers/lavender.png`}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-0 w-[120%] max-w-none -translate-x-1/2 -translate-y-[55%] opacity-40 select-none"
          />
          */}
          {/* O nome do grupo varia de tamanho, então o título escalona com a
              tela e quebra por palavra em vez de estourar a largura. */}
          <h1 className="font-display text-title relative z-10 text-4xl leading-[1.25] break-words sm:text-5xl md:text-6xl">
            {t('welcome.greeting', { name: guest.groupName })}
          </h1>

          <p className="font-sans text-title relative z-10 mt-24 text-sm tracking-[0.25em] uppercase">
            {t('welcome.invitation')}
          </p>

          {/* Saída para quem digitou o nome errado — discreta, mas sempre à mão */}
          <button
            type="button"
            onClick={onReset}
            className="font-garamond text-title/60 hover:text-cta relative z-10 mt-8 border-t border-current pt-2 text-sm transition-colors"
          >
            {t('welcome.notYou')}
          </button>
        </div>
      </div>

      {/* Scroll cue — bottom-right, static */}
      <div className="absolute right-6 bottom-6 text-center">
        <span className="font-sans text-title text-[0.55rem] tracking-[0.4em] uppercase">
          SCROLL
        </span>
        <div className="bg-forest-deep/40 mx-auto mt-3 h-12 w-px" />
      </div>
    </section>
  )
}
