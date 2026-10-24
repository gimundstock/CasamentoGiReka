import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
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
 * O ritmo é calmo: a mola é bem amortecida, para o movimento parecer uma
 * foto sendo pousada, não um slider de produto.
 *
 * A pilha gira como um baralho: todas as fotos andam no mesmo sentido, e a
 * que sai por uma ponta some e reaparece na outra, em vez de atravessar a
 * pilha na contramão (era isso que parecia embaralhar).
 *
 * Pausa com o ponteiro em cima ou com o foco do teclado dentro, para não
 * trocar a foto debaixo de quem está olhando.
 */
export function PhotoCarousel({ photos, intervalMs = 7000 }: Props) {
  // Posição contínua da pilha: cresce para a frente e diminui para trás sem
  // dar a volta. A foto ativa é ela módulo a quantidade de fotos; a volta de
  // cada foto (quantas vezes já passou pela pilha) sai dela também.
  const [pos, setPos] = useState(0)
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

  const safeIndex = count > 0 ? mod(pos, count) : 0

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (reduced || paused || count < 2) return
    timer.current = window.setTimeout(() => setPos((p) => p + 1), intervalMs)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [pos, paused, reduced, count, intervalMs])

  // Um arrasto que acabou de passar a foto não pode virar também um clique
  // na foto que estava debaixo do dedo.
  const arrastou = useRef(false)

  if (count === 0) return null

  /**
   * Distância circular até a foto da frente: 0 é a ativa, negativo à esquerda,
   * positivo à direita. O cálculo dá a volta, então a última foto é vizinha da
   * primeira e a pilha nunca "acaba". Com quantidade par, a foto oposta fica
   * sempre à direita, para não pular de lado a cada troca.
   */
  const distancia = (i: number) => {
    const r = mod(i - pos, count)
    return r <= Math.floor(count / 2) ? r : r - count
  }

  /** Anda a pilha d passos (negativo volta), pelo caminho mais curto. */
  const andar = (d: number) => {
    if (d !== 0) setPos((p) => p + d)
  }

  function aoSoltar(_: unknown, info: PanInfo) {
    const passou = Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 400
    if (!passou) return
    arrastou.current = true
    andar(info.offset.x < 0 ? 1 : -1)
  }

  const mola = reduced
    ? { duration: 0 }
    : // Mola amortecida, sem repique: assenta em ~0,9s.
      { type: 'spring' as const, stiffness: 70, damping: 19, mass: 1 }
  const fade = reduced ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' as const }

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
      <motion.div
        className="relative flex w-full touch-pan-y items-center justify-center"
        // Container de tamanho: os cards se medem pela altura da caixa (cqh),
        // e não só pela largura, para nunca passarem dela em telas baixas.
        style={{ height: 'min(70%, 32rem)', containerType: 'size' }}
        onPanStart={() => (arrastou.current = false)}
        onPanEnd={aoSoltar}
      >
        <AnimatePresence initial={false}>
          {visible.map((photo, i) => {
            const d = distancia(i)
            const atras = Math.abs(d)
            const frente = d === 0
            // Em que volta da pilha esta foto está. Quando ela sai por uma ponta
            // e entra pela outra, a volta muda, a chave muda, e a foto some de
            // um lado e reaparece do outro em vez de cruzar a pilha.
            const volta = (pos + d - i) / count

            return (
              <motion.button
                key={`${photo.src}#${volta}`}
                type="button"
                aria-label={photo.alt}
                aria-current={frente}
                aria-hidden={atras > DEPTH}
                tabIndex={atras > DEPTH ? -1 : 0}
                onClick={() => {
                  if (arrastou.current) {
                    arrastou.current = false
                    return
                  }
                  andar(d)
                }}
                className="focus-visible:ring-cta absolute cursor-pointer rounded-[3px] bg-white p-3 pb-16 focus:outline-none focus-visible:ring-2"
                style={{
                  // A largura respeita a caixa nos dois sentidos:
                  // - na largura, a pilha inteira (as duas vizinhas de cada
                  //   lado, deslocadas, giradas e menores) ocupa ~2,4× a foto
                  //   da frente, então ela fica em ≤ 41% para ninguém ser
                  //   cortado nas bordas;
                  // - na altura, a polaroide tem 1,25 × (largura − 24px) de
                  //   foto + 76px de moldura, então cabe quando
                  //   largura ≤ (altura − 46px) × 0,8.
                  width: 'min(41cqw, 20rem, calc((100cqh - 46px) * 0.8))',
                  zIndex: 30 - atras,
                }}
                initial={{
                  x: `${d * 34}%`,
                  rotate: d * 7,
                  scale: 1 - atras * 0.11 - 0.08,
                  opacity: 0,
                }}
                exit={{ opacity: 0, scale: 1 - atras * 0.11 - 0.08, transition: fade }}
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
                  // A sombra cresce com a elevação: sem desfoque para separar as
                  // camadas, é ela que faz o trabalho de profundidade. Ela anda
                  // junto com a foto em vez de trocar de uma vez.
                  boxShadow: frente
                    ? '0px 22px 50px -12px rgba(0,0,0,0.45)'
                    : `0px ${14 - atras * 4}px ${34 - atras * 8}px -12px rgba(0,0,0,${0.34 - atras * 0.07})`,
                }}
                transition={{ default: mola, opacity: fade }}
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
        </AnimatePresence>
      </motion.div>

      {/* Marcadores, logo abaixo da pilha */}
      {count > 1 && (
        <div className="z-40 flex gap-2">
          {visible.map((photo, i) => (
            <button
              key={`dot-${photo.src}`}
              type="button"
              onClick={() => andar(distancia(i))}
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

/** Módulo que nunca dá negativo. */
function mod(n: number, m: number) {
  return ((n % m) + m) % m
}
