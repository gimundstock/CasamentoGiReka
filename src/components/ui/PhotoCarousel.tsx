import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '../motion/useReducedMotion'

export interface CarouselPhoto {
  src: string
  alt: string
  /** Legenda manuscrita na tarja branca de baixo. */
  caption?: string
}

interface Props {
  photos: CarouselPhoto[]
  /** Tempo entre avanços automáticos, em ms. */
  intervalMs?: number
}

/** Quantas polaroides aparecem atrás da da frente, de cada lado. */
const DEPTH = 2

/**
 * Pilha de polaroides. A foto ativa fica à frente e reta; as vizinhas espiam
 * atrás, deslocadas para os lados, inclinadas e menores — um baralho de fotos
 * espalhado sobre a mesa.
 *
 * O ritmo é deliberadamente lento: a troca demora e a mola é bem amortecida,
 * para o movimento parecer uma foto sendo pousada, não um slider de produto.
 *
 * Pausa com o ponteiro em cima ou com o foco do teclado dentro, para não
 * trocar a foto debaixo de quem está olhando.
 */
export function PhotoCarousel({ photos, intervalMs = 9000 }: Props) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const reduced = useReducedMotion()

  // Fotos que falharam ao carregar saem da pilha — uma 404 não pode virar
  // uma moldura branca vazia.
  const visible = photos.filter((p) => !broken.has(p.src))
  const count = visible.length

  const markBroken = useCallback((src: string) => {
    setBroken((prev) => new Set(prev).add(src))
  }, [])

  const safeIndex = count > 0 ? index % count : 0

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (reduced || paused || count < 2) return
    timer.current = window.setTimeout(() => setIndex((i) => (i + 1) % count), intervalMs)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [safeIndex, paused, reduced, count, intervalMs])

  if (count === 0) return null

  /**
   * Distância circular até a foto da frente: 0 é a ativa, negativo à esquerda,
   * positivo à direita. O cálculo dá a volta, então a última foto é vizinha da
   * primeira e a pilha nunca "acaba".
   */
  const distancia = (i: number) => {
    const bruta = i - safeIndex
    const meio = Math.floor(count / 2)
    if (bruta > meio) return bruta - count
    if (bruta < -meio) return bruta + count
    return bruta
  }

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-7 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Caixa da pilha: os cards são absolutos, então precisam de um pai
          com altura própria — assim os marcadores caem logo abaixo das fotos
          em vez de no rodapé da coluna inteira. */}
      <div
        className="relative flex w-full items-center justify-center"
        style={{ height: 'min(70%, 32rem)' }}
      >
        {visible.map((photo, i) => {
          const d = distancia(i)
          const atras = Math.abs(d)
          const frente = d === 0

          return (
            <motion.button
              key={photo.src}
              type="button"
              aria-label={photo.alt}
              aria-current={frente}
              aria-hidden={atras > DEPTH}
              tabIndex={atras > DEPTH ? -1 : 0}
              onClick={() => setIndex(i)}
              className="focus-visible:ring-cta absolute cursor-pointer rounded-[3px] bg-white p-3 pb-16 focus:outline-none focus-visible:ring-2"
              style={{
                width: 'min(62%, 20rem)',
                // A sombra cresce com a elevação: sem desfoque para separar as
                // camadas, é ela que faz o trabalho de profundidade.
                boxShadow: frente
                  ? '0 22px 50px -12px rgba(0,0,0,0.45)'
                  : `0 ${14 - atras * 4}px ${34 - atras * 8}px -12px rgba(0,0,0,${0.34 - atras * 0.07})`,
              }}
              initial={false}
              animate={{
                // Vizinhas saem para o lado, encolhem e tombam um pouco.
                x: `${d * 34}%`,
                rotate: d * 7,
                // Padrão iOS: a profundidade vem de ESCALA e SOMBRA, não de
                // desfoque, dessaturação ou transparência. No iOS o desfoque
                // é material — fundo atrás de folha modal, alerta, barra —
                // e nunca serve para apagar cards irmãos de um carrossel.
                // As fotos de trás ficam nítidas e com a cor cheia, só menores.
                scale: frente ? 1 : 1 - atras * 0.11,
                // A opacidade só serve para esconder quem passa da
                // profundidade — nunca para as fotos visíveis da pilha.
                opacity: atras > DEPTH ? 0 : 1,
                zIndex: 30 - atras,
              }}
              transition={
                reduced
                  ? { duration: 0 }
                  : // Mola lenta e bem amortecida: ~1,6s até assentar, sem
                    // repique. Bem mais vagaroso que a referência.
                    { type: 'spring', stiffness: 26, damping: 18, mass: 1.4 }
              }
            >
              <img
                src={photo.src}
                alt=""
                className="aspect-[4/5] w-full rounded-[1px] object-cover"
                onError={() => markBroken(photo.src)}
                draggable={false}
              />
              {photo.caption && (
                <span className="font-display text-title absolute inset-x-2 bottom-4 overflow-visible text-center text-xl leading-tight whitespace-nowrap lowercase">
                  {photo.caption}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Marcadores, logo abaixo da pilha */}
      {count > 1 && (
        <div className="z-40 flex gap-2">
          {visible.map((photo, i) => (
            <button
              key={`dot-${photo.src}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Foto ${i + 1} de ${count}`}
              aria-current={i === safeIndex}
              className={`h-1.5 rounded-full transition-all duration-700 ${
                i === safeIndex ? 'bg-title w-6' : 'bg-title/30 hover:bg-title/60 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
