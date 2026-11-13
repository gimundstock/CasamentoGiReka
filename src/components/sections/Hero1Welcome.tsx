import { useTranslation } from 'react-i18next'
import type { Guest } from '../../types'
import {
  guestName,
  guestPhotoSources,
  invitationOptions,
  withDefaultPhotos,
} from '../../utils/guest'
import { CONFIG } from '../../content.config'
import { PhotoCarousel, type CarouselPhoto } from '../ui/PhotoCarousel'

interface Props {
  guest: Guest
  /** Limpa o convidado salvo e volta para a tela de nome. */
  onReset: () => void
}

export function Hero1Welcome({ guest, onReset }: Props) {
  const { t } = useTranslation()

  const base = import.meta.env.BASE_URL
  const altText = `${CONFIG.couple.bride} & ${CONFIG.couple.groom}`

  // A celebração (o último capítulo da história) abre sempre o carrossel;
  // depois vêm as fotos do convidado: a cópia que o deploy fez da pasta
  // dele no Drive, ou o próprio Drive para uma foto mais nova. Enquanto ele
  // tiver menos fotos que as padrão (CONFIG.welcome.defaultPhotos), elas
  // completam o carrossel depois das dele: cada foto do convidado tira a
  // última padrão. Nenhuma foto do hero leva legenda.
  const celebration = CONFIG.story.milestones[CONFIG.story.milestones.length - 1]
  const photos: CarouselPhoto[] = [
    ...(celebration ? [{ src: `${base}photos/${celebration.photo}`, alt: altText }] : []),
    ...withDefaultPhotos<CarouselPhoto>(
      guestPhotoSources(guest, base).map((p) => ({ ...p, alt: guestName(guest) })),
      CONFIG.welcome.defaultPhotos.map((photo) => ({ src: `${base}photos/${photo}`, alt: altText }))
    ),
  ]

  return (
    <section
      id="welcome"
      className="bg-peach relative flex min-h-screen w-full flex-col overflow-hidden pt-20 lg:flex-row lg:pt-0"
    >
      {/* O lago em aquarela assenta no canto inferior direito, por baixo das
          fotos e do texto, e ocupa a altura inteira da seção. O nome fica logo
          abaixo do braço fino que chega pela borda direita; as posições em %
          acompanham a imagem (1070×1008) em qualquer altura. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 z-0 aspect-[1070/1008] h-full select-none"
      >
        <img
          src={`${base}flowers/lake.webp`}
          alt=""
          draggable={false}
          className="h-full w-full opacity-60"
        />
        <span className="font-garamond text-title/60 absolute top-[56.5%] right-[2%] text-[0.6rem] tracking-[0.15em] whitespace-nowrap italic">
          {t('welcome.lake')}
        </span>
      </div>
      {/* Photo column — left on desktop, top on mobile. No celular a seção
          começa abaixo da nav (pt-20) para as fotos não passarem por baixo
          dela. */}
      <div className="relative w-full lg:w-[58%]">
        <div className="h-[46svh] w-full lg:h-screen">
          <PhotoCarousel photos={photos} />
        </div>
      </div>

      {/* Text column — right on desktop, below on mobile */}
      {/* lg:pr-36 deixa livre a faixa da direita onde fica o rótulo do lago, que
          antes caía em cima de "conosco". */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-10 lg:py-0 lg:pr-36 lg:pl-0">
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
              tela e quebra por palavra em vez de estourar a largura. As
              maiúsculas da Amsterdam sobem e descem muito além da linha: cada
              tamanho leva a própria entrelinha (1.8), senão o text-5xl/6xl
              volta a 1 e uma linha cai em cima da outra. */}
          <h1 className="font-display text-title relative z-10 text-4xl/[1.8] break-words sm:text-5xl/[1.8] md:text-6xl/[1.8]">
            {guestName(guest)}
          </h1>

          <p className="font-sans text-title relative z-10 mt-10 text-sm tracking-[0.25em] text-balance uppercase lg:mt-36">
            {t('welcome.invitation', invitationOptions(guest))}
          </p>

          {/* Saída para quem digitou o nome errado — discreta, mas sempre à mão */}
          <button
            type="button"
            onClick={onReset}
            className="font-garamond text-title/70 hover:text-cta relative z-10 mt-6 border-t border-current py-3 text-sm transition-colors lg:mt-8"
          >
            {t('welcome.notYou')}
          </button>
        </div>
      </div>

      {/* Scroll cue — bottom-right, static. Só no desktop: no celular ele
          caía em cima do "Não é você?". */}
      <div aria-hidden="true" className="absolute right-6 bottom-6 hidden text-center lg:block">
        <span className="font-sans text-title text-[0.55rem] tracking-[0.4em] uppercase">
          SCROLL
        </span>
        <div className="bg-forest-deep/40 mx-auto mt-3 h-12 w-px" />
      </div>
    </section>
  )
}
