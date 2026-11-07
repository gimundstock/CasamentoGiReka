import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { Flower, Petal } from '../botanicals'
import { Bloom } from '../motion/Bloom'
import { useReducedMotion } from '../motion/useReducedMotion'
import { GiftChapters, GiftChaptersStatic } from '../gifts/GiftChapters'
import { useGifts } from '../../hooks/useGifts'
import { purchaseGift, submitCard } from '../../api/sheets'
import { CARD_THEMES, MessageCard, getCardTheme, type CardThemeId } from '../gifts/cardThemes'
import { buildPixPayload } from '../../utils/pix'
import type { Cota, Gift } from '../../types'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'

interface Props {
  guest: Guest
}

type ModalStep = 'cotas' | 'pix' | 'confirm' | 'card' | 'success'

interface PurchaseState {
  gift: Gift
  selectedCotas: Cota[]
  step: ModalStep
  cardMessage: string
  cardTheme: CardThemeId
  cardFrom: string
  cardSent: boolean
  email: string
  submitting: boolean
  error: string | null
  pixCopied: boolean
}

export function GiftShop({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const { gifts, loading, markCotasPurchased } = useGifts()
  const [purchase, setPurchase] = useState<PurchaseState | null>(null)
  const reduced = useReducedMotion()

  function openGift(gift: Gift) {
    const availableCotas = gift.cotas.filter((c) => !c.purchased)
    if (availableCotas.length === 0) return

    const step: ModalStep = gift.cotas.length === 1 ? 'pix' : 'cotas'
    const selectedCotas = gift.cotas.length === 1 ? availableCotas : []

    setPurchase({
      gift,
      selectedCotas,
      step,
      cardMessage: '',
      cardTheme: 'cerrado',
      cardFrom: guest.groupName,
      cardSent: false,
      email: '',
      submitting: false,
      error: null,
      pixCopied: false,
    })
  }

  function toggleCota(cota: Cota) {
    if (!purchase) return
    const exists = purchase.selectedCotas.find((c) => c.cotaId === cota.cotaId)
    setPurchase({
      ...purchase,
      selectedCotas: exists
        ? purchase.selectedCotas.filter((c) => c.cotaId !== cota.cotaId)
        : [...purchase.selectedCotas, cota],
    })
  }

  function totalAmount(cotas: Cota[]) {
    return cotas.reduce((sum, c) => sum + c.price, 0)
  }

  function pixPayload() {
    if (!purchase) return ''
    return buildPixPayload({
      pixKey: CONFIG.couple.pixKey,
      amount: totalAmount(purchase.selectedCotas),
      name: `${CONFIG.couple.bride} ${CONFIG.couple.groom}`.slice(0, 25),
      city: 'Brasilia',
      txid: purchase.selectedCotas[0]?.cotaId ?? '***',
    })
  }

  async function handleConfirm() {
    if (!purchase) return
    if (!purchase.email.trim()) {
      setPurchase({ ...purchase, error: t('gifts.emailRequired') })
      return
    }

    setPurchase({ ...purchase, submitting: true, error: null })
    try {
      await purchaseGift({
        guestId: guest.guestId,
        giftId: purchase.gift.giftId,
        giftName: lang === 'pt' ? purchase.gift.name_pt : purchase.gift.name_en,
        selectedCotaIds: purchase.selectedCotas.map((c) => c.cotaId),
        selectedCotaLabels: purchase.selectedCotas.map((c) => c.label_pt),
        totalPrice: totalAmount(purchase.selectedCotas),
        guestEmail: purchase.email,
        cardMessage: '',
      })
      markCotasPurchased(purchase.selectedCotas.map((c) => c.cotaId))
      setPurchase({ ...purchase, step: 'card', submitting: false })
    } catch {
      setPurchase({ ...purchase, submitting: false, error: t('gifts.error') })
    }
  }

  async function handleSendCard() {
    if (!purchase) return
    if (!purchase.cardMessage.trim()) {
      setPurchase({ ...purchase, error: t('gifts.cardMessageRequired') })
      return
    }
    setPurchase({ ...purchase, submitting: true, error: null })
    try {
      await submitCard({
        guestId: guest.guestId,
        giftName: lang === 'pt' ? purchase.gift.name_pt : purchase.gift.name_en,
        theme: purchase.cardTheme,
        from: purchase.cardFrom,
        message: purchase.cardMessage,
      })
      setPurchase({ ...purchase, step: 'success', cardSent: true, submitting: false })
    } catch {
      setPurchase({ ...purchase, submitting: false, error: t('gifts.cardError') })
    }
  }

  function renderCard(gift: Gift, index: number, width: number) {
    return (
      <GiftCard
        gift={gift}
        index={index}
        lang={lang}
        compact={width < 170}
        onOpen={() => openGift(gift)}
        t={t}
      />
    )
  }

  async function copyPix() {
    if (!purchase) return
    try {
      await navigator.clipboard.writeText(pixPayload())
      setPurchase({ ...purchase, pixCopied: true })
      setTimeout(() => setPurchase((p) => (p ? { ...p, pixCopied: false } : p)), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    // Pinned, it lies over the RSVP's last screen (see GiftChapters).
    <section
      id="gifts"
      // Its paper is on the pinned list itself (GiftChapters), which stays
      // unseen until it pins: an opaque section would rise over the RSVP.
      className={`relative ${reduced ? 'bg-peach bg-paper' : ''}`}
      style={reduced ? undefined : { marginTop: '-100vh', zIndex: 42 }}
    >
      {/* Pinned, the list keeps its place while it loads (it shows the
          title first, and the polaroids only once there). */}
      {loading && reduced ? (
        <div className="text-title py-32 text-center font-serif">…</div>
      ) : reduced ? (
        // Reduced motion: nothing pinned — the title, then each chapter.
        <div className="mx-auto max-w-5xl px-6 py-32 md:py-48">
          <div className="mb-20 text-center md:mb-28">
            <p className="font-sans text-amber-deep mb-6 text-[0.65rem] tracking-[0.4em] uppercase">
              {t('nav.gifts')}
            </p>
            <h2 className="font-display text-title text-2xl md:text-3xl">{t('gifts.title')}</h2>
          </div>
          <GiftChaptersStatic gifts={gifts} renderCard={renderCard} />
        </div>
      ) : (
        <GiftChapters gifts={gifts} renderCard={renderCard} />
      )}

      {purchase && (
        <GiftModal
          purchase={purchase}
          lang={lang}
          onClose={() => setPurchase(null)}
          onToggleCota={toggleCota}
          onProceedToPixFromCotas={() => setPurchase({ ...purchase, step: 'pix' })}
          onProceedToConfirm={() => setPurchase({ ...purchase, step: 'confirm' })}
          onBack={() =>
            setPurchase({
              ...purchase,
              step: purchase.gift.cotas.length === 1 ? 'cotas' : 'cotas',
              error: null,
            })
          }
          onCardMessageChange={(v) => setPurchase({ ...purchase, cardMessage: v })}
          onCardThemeChange={(v) => setPurchase({ ...purchase, cardTheme: v })}
          onCardFromChange={(v) => setPurchase({ ...purchase, cardFrom: v })}
          onSendCard={handleSendCard}
          onSkipCard={() => setPurchase({ ...purchase, step: 'success', error: null })}
          onEmailChange={(v) => setPurchase({ ...purchase, email: v })}
          onConfirm={handleConfirm}
          onCopyPix={copyPix}
          pixPayload={pixPayload()}
          totalAmount={totalAmount(purchase.selectedCotas)}
        />
      )}
    </section>
  )
}

// ─── Placeholder photo ───────────────────────────────────────────────────────

// Gifts without a photo yet show one of the falling wildflowers on cream
// paper inside the polaroid, so the grid still reads as a set of photos.
const PLACEHOLDER_FLOWERS = [0, 3, 5, 8, 11].map(
  (i) => `${import.meta.env.BASE_URL}flowers/falling/flower_${String(i).padStart(2, '0')}.webp`
)

function GiftPlaceholder({ seed }: { seed: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-peach-light">
      <img
        src={PLACEHOLDER_FLOWERS[seed % PLACEHOLDER_FLOWERS.length]}
        alt=""
        aria-hidden
        loading="lazy"
        className="w-1/2 opacity-80"
        style={{ rotate: `${((seed * 37) % 60) - 30}deg` }}
      />
    </div>
  )
}

// ─── Gift card ───────────────────────────────────────────────────────────────

interface GiftCardProps {
  gift: Gift
  index: number
  lang: 'pt' | 'en'
  /** A small polaroid (a phone's grid): smaller type, a shorter back. */
  compact: boolean
  onOpen: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function GiftCard({ gift, index, lang, compact, onOpen, t }: GiftCardProps) {
  const [imageFailed, setImageFailed] = useState(!gift.imageUrl)
  // No hover on touch screens: the first tap turns the polaroid over, the
  // next one (on its back) opens the gift.
  const [hover] = useState(() => window.matchMedia('(hover: hover)').matches)
  const [turned, setTurned] = useState(false)
  // Turned over as the invitation is (RSVP): like a card in the hand, not a
  // sign on a pivot — the turn eases in and out, and on the way the card
  // lifts a little, grows, leans back and swings a few degrees before
  // settling flat again. Here over time, not with the scroll.
  const turn = useMotionValue(0)
  useEffect(() => {
    const a = animate(turn, turned ? 1 : 0, { duration: 0.8, ease: [0.37, 0, 0.63, 1] })
    return () => a.stop()
  }, [turned, turn])
  const rotateY = useTransform(turn, (t) => t * 180)
  const arc = useTransform(turn, (t) => Math.sin(t * Math.PI))
  const lift = useTransform(arc, (a) => -a * 12)
  const grow = useTransform(arc, (a) => 1 + a * 0.04)
  const lean = useTransform(arc, (a) => a * 10)
  const swing = useTransform(turn, (t) => Math.sin(t * Math.PI) * -5 * (1 - t * 0.6))
  // Which face shows is chosen by the angle, not left to backface-visibility
  // (WebKit draws turned-away faces).
  const frontShown = useTransform(rotateY, (r) => (r < 90 ? 'visible' : 'hidden'))
  const backShown = useTransform(rotateY, (r) => (r < 90 ? 'hidden' : 'visible'))
  const isSoldOut = gift.available === 0
  const isPartial = gift.total > 1 && gift.available < gift.total && !isSoldOut
  const name = lang === 'pt' ? gift.name_pt : gift.name_en
  const description = lang === 'pt' ? gift.description_pt : gift.description_en
  const lowestPrice = Math.min(...gift.cotas.filter((c) => !c.purchased).map((c) => c.price))

  const onClick = () => {
    if (!hover && !turned) return setTurned(true)
    if (!isSoldOut) onOpen()
  }
  const face = 'absolute inset-0 rounded-[3px] [backface-visibility:hidden]'

  return (
    <button
      type="button"
      onClick={onClick}
      // Turned over by hover or keyboard focus (mouse), or by the first tap
      // (touch).
      onMouseEnter={() => hover && setTurned(true)}
      onMouseLeave={() => hover && setTurned(false)}
      onFocus={(e) => hover && e.currentTarget.matches(':focus-visible') && setTurned(true)}
      onBlur={() => setTurned(false)}
      aria-disabled={isSoldOut}
      aria-label={name}
      className={`group mx-auto block w-full max-w-[16rem] text-left [perspective:1200px] ${
        isSoldOut ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Polaroid, same as the story photos: white border, thicker bottom
          edge with the gift's name written on it, soft shadow. Tilts a
          little, straightens on hover — and turns over to its back. */}
      <div
        className={`transition-transform duration-500 group-hover:rotate-0 ${
          index % 2 === 0 ? '-rotate-[1.5deg]' : 'rotate-[1.5deg]'
        } ${turned ? 'rotate-0' : ''}`}
      >
        <motion.div
          className="relative aspect-[4/6.3] [transform-style:preserve-3d]"
          style={{
            transformPerspective: 1600,
            y: lift,
            scale: grow,
            rotateX: lean,
            rotateY,
            rotateZ: swing,
          }}
        >
          {/* Front: the picture, and the name under it. */}
          <motion.div
            className={`${face} flex flex-col bg-white p-2.5 pb-0 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] ${
              isSoldOut ? 'opacity-60' : ''
            }`}
            style={{ visibility: frontShown }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1px]">
              {imageFailed ? (
                <GiftPlaceholder seed={index} />
              ) : (
                <img
                  src={gift.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              )}
              {isSoldOut && (
                <div className="absolute inset-0 flex items-center justify-center bg-peach/70">
                  <span className="font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title">
                    {t('gifts.soldOutStamp')}
                  </span>
                </div>
              )}
            </div>
            {/* Gift names in Jost, as the guests' names on the invitation,
                and the price under them: centred in the strip under the
                picture. */}
            <div className="flex flex-1 flex-col items-center justify-center px-1.5 py-1 text-center">
              <h3
                className={`font-sans text-title leading-snug line-clamp-2 ${
                  compact ? 'text-[0.8rem]' : 'text-[0.95rem]'
                }`}
              >
                {name}
              </h3>
              {!isSoldOut && (
                <p
                  className={`font-sans text-amber-deep mt-0.5 tabular-nums ${
                    compact ? 'text-[0.75rem]' : 'text-sm'
                  }`}
                >
                  {gift.total > 1 && <span className="text-title/70">{t('gifts.fromPrice')} </span>}
                  R$ {Number.isFinite(lowestPrice) ? lowestPrice : gift.cotas[0]?.price}
                </p>
              )}
            </div>
          </motion.div>

          {/* Back: what it is and what it costs. */}
          <motion.div
            className={`${face} bg-[#FDFBF6] bg-paper flex flex-col shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] [transform:rotateY(180deg)] ${compact ? 'p-3' : 'p-5'}`}
            style={{ visibility: backShown }}
          >
            <p className={`font-sans text-title leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
              {name}
            </p>
            <div className={`h-px w-10 bg-amber/40 ${compact ? 'mt-2' : 'mt-3'}`} />
            {description && (
              <p
                className={`font-serif text-title leading-relaxed ${
                  compact
                    ? 'mt-2 text-[0.8rem] line-clamp-[5]'
                    : 'mt-3 text-[0.9rem] line-clamp-[7]'
                }`}
              >
                {description}
              </p>
            )}
            <div className="mt-auto pt-4">
              {isSoldOut ? (
                <p className="font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title">
                  {t('gifts.soldOutStamp')}
                </p>
              ) : (
                <>
                  <p
                    className={`font-sans tabular-nums text-amber-deep ${compact ? 'text-base' : 'text-xl'}`}
                  >
                    {gift.total > 1 && (
                      <span className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-title mr-2">
                        {t('gifts.fromPrice')}
                      </span>
                    )}
                    R$ {Number.isFinite(lowestPrice) ? lowestPrice : gift.cotas[0]?.price}
                  </p>
                  {isPartial && (
                    <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-title mt-1">
                      {t('gifts.partiallyAvailable', {
                        available: gift.available,
                        total: gift.total,
                      })}
                    </p>
                  )}
                  <p
                    className={`font-sans text-[0.6rem] tracking-[0.3em] uppercase text-amber-deep ${
                      compact ? 'mt-2' : 'mt-3'
                    }`}
                  >
                    {t(hover ? 'gifts.backHintClick' : 'gifts.backHintTap')}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </button>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  purchase: PurchaseState
  lang: 'pt' | 'en'
  onClose: () => void
  onToggleCota: (c: Cota) => void
  onProceedToPixFromCotas: () => void
  onProceedToConfirm: () => void
  onBack: () => void
  onCardMessageChange: (v: string) => void
  onCardThemeChange: (v: CardThemeId) => void
  onCardFromChange: (v: string) => void
  onSendCard: () => void
  onSkipCard: () => void
  onEmailChange: (v: string) => void
  onConfirm: () => void
  onCopyPix: () => void
  pixPayload: string
  totalAmount: number
}

function GiftModal(props: ModalProps) {
  const { t } = useTranslation()
  const { purchase, lang } = props
  const {
    gift,
    step,
    selectedCotas,
    cardMessage,
    cardTheme,
    cardFrom,
    cardSent,
    email,
    submitting,
    error,
    pixCopied,
  } = purchase
  const availableCotas = gift.cotas
  const giftName = lang === 'pt' ? gift.name_pt : gift.name_en

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-forest-deep/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && props.onClose()}
    >
      <div className="relative bg-peach-light w-full sm:max-w-md rounded-t-3xl sm:rounded-[28px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(63,96,65,0.25)] border border-sage/30">
        {/* Paper texture inside modal */}
        <div
          className="absolute inset-0 bg-paper opacity-25 pointer-events-none rounded-t-3xl sm:rounded-[28px]"
          aria-hidden
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="pr-4">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-amber-deep mb-1">
                {step === 'success' ? t('gifts.successKicker') : t('gifts.stepKicker')}
              </p>
              <h3 className="font-sans text-xl text-title leading-snug">{giftName}</h3>
              {step !== 'success' && (
                <p className="font-serif text-sm text-title mt-1">
                  {lang === 'pt' ? gift.description_pt : gift.description_en}
                </p>
              )}
            </div>
            <button
              onClick={props.onClose}
              className="text-title/70 hover:text-title transition-colors shrink-0 mt-1"
              aria-label={t('gifts.close')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Step: cotas selector ── */}
          {step === 'cotas' && (
            <>
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-title mb-4">
                {t('gifts.cotasTitle')}
              </p>

              <div className="flex flex-wrap gap-2.5 mb-6">
                {availableCotas.map((cota) => {
                  const isSold = cota.purchased
                  const isSelected = !!selectedCotas.find((c) => c.cotaId === cota.cotaId)
                  const label = lang === 'pt' ? cota.label_pt : cota.label_en

                  const baseChip =
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans text-sm transition-[background-color,color,box-shadow,opacity]'
                  let chipClass = ''

                  if (isSold) {
                    chipClass = `${baseChip} bg-sage/20 text-title line-through cursor-not-allowed opacity-60`
                  } else if (isSelected) {
                    chipClass = `${baseChip} bg-forest-deep text-peach-light shadow-[0_4px_14px_rgba(63,96,65,0.25)]`
                  } else {
                    chipClass = `${baseChip} bg-white/60 border border-sage/40 text-title hover:border-forest/40 hover:bg-white/80`
                  }

                  return (
                    <button
                      key={cota.cotaId}
                      type="button"
                      disabled={isSold}
                      onClick={() => !isSold && props.onToggleCota(cota)}
                      className={chipClass}
                    >
                      {isSelected && !isSold && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="-8 -8 16 16"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z"
                            fill="#D0D8B8"
                            transform="translate(-6 0) rotate(-20)"
                          />
                        </svg>
                      )}
                      <span>{label}</span>
                      <span
                        className={
                          isSelected
                            ? 'text-peach-light/90 font-semibold'
                            : isSold
                              ? 'text-title'
                              : 'text-amber-deep font-semibold'
                        }
                      >
                        · R$ {cota.price}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedCotas.length > 0 && (
                <p className="text-center font-serif text-base text-title mb-5">
                  {t('gifts.totalSelected', { amount: props.totalAmount.toFixed(2) })}
                </p>
              )}

              <PrimaryButton
                disabled={selectedCotas.length === 0}
                onClick={props.onProceedToPixFromCotas}
              >
                {selectedCotas.length === 0 ? t('gifts.noCotas') : t('gifts.proceed')}
              </PrimaryButton>
            </>
          )}

          {/* ── Step: PIX QR ── */}
          {step === 'pix' && (
            <>
              <p className="font-serif text-sm text-title text-center mb-6 leading-relaxed">
                {t('gifts.pixInstructions')}
              </p>

              <div className="flex justify-center mb-5">
                <ArchQrFrame>
                  <QRCode
                    value={props.pixPayload || ' '}
                    size={200}
                    logoImage="/pix-logo.png"
                    removeQrCodeBehindLogo
                    logoPadding={4}
                    qrStyle="dots"
                    eyeRadius={6}
                    fgColor="#3F5F3D"
                    bgColor="transparent"
                  />
                </ArchQrFrame>
              </div>

              <p className="text-center font-sans tabular-nums text-3xl text-amber-deep mb-1">
                R$ {props.totalAmount.toFixed(2)}
              </p>
              <p className="text-center font-serif text-xs text-title mb-6">
                {selectedCotas.map((c) => (lang === 'pt' ? c.label_pt : c.label_en)).join(' + ')}
              </p>

              <button
                onClick={props.onCopyPix}
                className="w-full mb-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-sage/50 text-title hover:bg-sage/20 font-sans text-xs tracking-widest uppercase transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V6a1 1 0 0 1 1-1h9" />
                </svg>
                {pixCopied ? (
                  <span className="animate-bloom inline-block text-title">
                    {t('gifts.pixCopied')}
                  </span>
                ) : (
                  <span>{t('gifts.pixCopy')}</span>
                )}
              </button>

              <PrimaryButton onClick={props.onProceedToConfirm}>{t('gifts.proceed')}</PrimaryButton>

              {gift.cotas.length > 1 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={props.onBack}
                    className="font-sans text-xs tracking-widest uppercase text-title hover:text-title transition-colors"
                  >
                    {t('gifts.back')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Step: confirm (card + email) ── */}
          {step === 'confirm' && (
            <>
              <div className="space-y-5 mb-6">
                <div>
                  <label
                    htmlFor="gift-email"
                    className="font-sans text-[10px] tracking-[0.3em] uppercase text-title block mb-2"
                  >
                    {t('gifts.yourEmail')}
                  </label>
                  <input
                    id="gift-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => props.onEmailChange(e.target.value)}
                    placeholder={t('gifts.emailPlaceholder')}
                    required
                    className="w-full px-5 py-3.5 rounded-2xl border border-sage/40 bg-white/70 font-serif text-base text-title placeholder:text-title/50 focus:outline-none focus:border-forest focus:bg-white/90 focus:ring-2 focus:ring-forest/20 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-terracotta text-center mb-4 font-serif">
                  {error}
                </p>
              )}

              <PrimaryButton
                disabled={submitting}
                onClick={props.onConfirm}
                submitting={submitting}
              >
                {submitting ? t('gifts.confirming') : t('gifts.confirmPurchase')}
              </PrimaryButton>

              <div className="mt-3 text-center">
                <button
                  onClick={props.onBack}
                  className="font-sans text-xs tracking-widest uppercase text-title hover:text-title transition-colors"
                >
                  {t('gifts.back')}
                </button>
              </div>
            </>
          )}

          {/* ── Step: card (after the gift is confirmed) ── */}
          {step === 'card' && (
            <>
              <h4 className="font-sans text-xl text-title mb-1">{t('gifts.cardStepTitle')}</h4>
              <p className="font-serif text-sm text-title mb-5">{t('gifts.cardStepText')}</p>

              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-title mb-2">
                {t('gifts.cardTheme')}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {CARD_THEMES.map((th) => {
                  const active = th.id === cardTheme
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => props.onCardThemeChange(th.id)}
                      aria-pressed={active}
                      aria-label={lang === 'pt' ? th.label_pt : th.label_en}
                      className={`overflow-hidden rounded-lg border-2 text-left transition-[border-color,box-shadow,opacity] ${
                        active ? 'border-forest-deep shadow-md' : 'border-transparent opacity-80'
                      }`}
                    >
                      <img
                        src={th.image}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="block aspect-[4/3] w-full object-cover"
                      />
                      <span className="block bg-white/70 px-1 py-1 text-center font-sans text-[10px] text-title">
                        {lang === 'pt' ? th.label_pt : th.label_en}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="mb-4">
                <MessageCard
                  theme={getCardTheme(cardTheme)}
                  message={cardMessage}
                  from={cardFrom}
                  placeholder={t('gifts.cardPlaceholder')}
                />
              </div>

              <div className="space-y-4 mb-5">
                <textarea
                  name="cardMessage"
                  value={cardMessage}
                  onChange={(e) => props.onCardMessageChange(e.target.value)}
                  placeholder={t('gifts.cardPlaceholder')}
                  rows={4}
                  maxLength={400}
                  aria-label={t('gifts.cardMessage')}
                  className="w-full px-5 py-4 rounded-2xl border border-sage/40 bg-white/70 font-serif text-base text-title placeholder:text-title/50 focus:outline-none focus:border-forest focus:bg-white/90 focus:ring-2 focus:ring-forest/20 resize-none transition-[border-color,background-color,box-shadow]"
                />
                <div>
                  <label
                    htmlFor="gift-card-from"
                    className="font-sans text-[10px] tracking-[0.3em] uppercase text-title block mb-2"
                  >
                    {t('gifts.cardFrom')}
                  </label>
                  <input
                    id="gift-card-from"
                    name="cardFrom"
                    type="text"
                    autoComplete="off"
                    value={cardFrom}
                    onChange={(e) => props.onCardFromChange(e.target.value)}
                    placeholder={t('gifts.cardFromPlaceholder')}
                    maxLength={60}
                    className="w-full px-5 py-3.5 rounded-2xl border border-sage/40 bg-white/70 font-serif text-base text-title placeholder:text-title/50 focus:outline-none focus:border-forest focus:bg-white/90 focus:ring-2 focus:ring-forest/20 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-terracotta text-center mb-4 font-serif">
                  {error}
                </p>
              )}

              <PrimaryButton
                disabled={submitting}
                onClick={props.onSendCard}
                submitting={submitting}
              >
                {submitting ? t('gifts.cardSending') : t('gifts.cardSend')}
              </PrimaryButton>

              <div className="mt-3 text-center">
                <button
                  onClick={props.onSkipCard}
                  className="font-sans text-xs tracking-widest uppercase text-title hover:text-title transition-colors"
                >
                  {t('gifts.cardSkip')}
                </button>
              </div>
            </>
          )}

          {/* ── Step: success ── */}
          {step === 'success' && (
            <div className="text-center py-2 relative">
              {/* Cascading blooms */}
              <div className="flex justify-center mb-4">
                <svg
                  width="200"
                  height="80"
                  viewBox="-100 -40 200 80"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <Bloom delay={0}>
                    <Flower
                      cx={-60}
                      cy={0}
                      variant="daisy"
                      color="#6F7F55"
                      size={1.1}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.15}>
                    <Flower
                      cx={-25}
                      cy={-12}
                      variant="cosmos"
                      color="#B96F52"
                      size={1.2}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.3}>
                    <Flower
                      cx={10}
                      cy={6}
                      variant="wild-rose"
                      color="#C58A7A"
                      size={1.3}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.45}>
                    <Flower
                      cx={45}
                      cy={-8}
                      variant="anemone"
                      color="#A88A9D"
                      size={1.1}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.6}>
                    <Flower
                      cx={75}
                      cy={4}
                      variant="filler"
                      color="#B8C2A3"
                      size={1.2}
                      animate={false}
                    />
                  </Bloom>
                </svg>
              </div>

              {/* Drifting petals */}
              <div className="absolute top-4 left-6 animate-float pointer-events-none" aria-hidden>
                <Petal color="#D0D8B8" size={18} rotation={-22} />
              </div>
              <div
                className="absolute top-8 right-8 animate-float pointer-events-none"
                style={{ animationDelay: '1s' }}
                aria-hidden
              >
                <Petal color="#C58A7A" size={14} rotation={28} />
              </div>

              <h4 className="font-display text-3xl text-title mb-2">{t('gifts.successTitle')}</h4>
              <p className="font-serif text-title mb-6 leading-relaxed max-w-xs mx-auto">
                {t('gifts.successText')}
              </p>

              {/* Receipt */}
              <div className="bg-white/60 border border-sage/30 rounded-2xl p-5 text-left mb-6">
                <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-title mb-2">
                  {t('gifts.summary')}
                </p>
                <p className="font-sans text-lg text-title">{giftName}</p>
                {selectedCotas.map((c) => (
                  <div key={c.cotaId} className="flex justify-between mt-1.5">
                    <span className="font-serif text-sm text-title">
                      {lang === 'pt' ? c.label_pt : c.label_en}
                    </span>
                    <span className="font-sans text-sm font-semibold text-amber-deep">
                      R$ {c.price}
                    </span>
                  </div>
                ))}
                <div className="border-t border-sage/30 mt-3 pt-2 flex justify-between">
                  <span className="font-sans text-xs uppercase tracking-widest text-title">
                    {t('gifts.total')}
                  </span>
                  <span className="font-sans tabular-nums text-lg text-amber-deep">
                    R$ {props.totalAmount.toFixed(2)}
                  </span>
                </div>
                {cardSent && (
                  <div className="mt-4">
                    <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-title mb-2">
                      {t('gifts.cardSent')}
                    </p>
                    <MessageCard
                      theme={getCardTheme(cardTheme)}
                      message={cardMessage}
                      from={cardFrom}
                    />
                  </div>
                )}
              </div>

              <PrimaryButton onClick={props.onClose}>{t('gifts.done')}</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

interface PrimaryButtonProps {
  onClick: () => void
  disabled?: boolean
  submitting?: boolean
  children: React.ReactNode
}

function PrimaryButton({ onClick, disabled, submitting, children }: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-deep px-8 py-3 font-sans text-sm tracking-widest uppercase text-peach-light transition-[background-color,transform,opacity] duration-300 hover:bg-forest-deep/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
    >
      <svg
        width="14"
        height="14"
        viewBox="-8 -8 16 16"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-90"
        aria-hidden
      >
        <path
          d="M 0 0 C 3 -5 9 -6 14 -3 C 16 1 12 5 7 5 C 2 5 -1 3 0 0 Z"
          fill="#D0D8B8"
          transform="translate(-7 0) rotate(-20)"
        />
      </svg>
      <span className={submitting ? 'animate-breath' : ''}>{children}</span>
    </button>
  )
}

// ─── Arch QR frame ───────────────────────────────────────────────────────────

interface ArchQrFrameProps {
  children: React.ReactNode
}

// A small arched backdrop SVG drawn behind the QR with sage corner blossoms.
function ArchQrFrame({ children }: ArchQrFrameProps) {
  const size = 240
  const archInset = 14

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Arch backdrop */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        aria-hidden
      >
        {/* Soft paper backing */}
        <path
          d={`M ${archInset} ${size - archInset}
             L ${archInset} ${size / 2}
             A ${size / 2 - archInset} ${size / 2 - archInset} 0 0 1 ${size - archInset} ${size / 2}
             L ${size - archInset} ${size - archInset} Z`}
          fill="#FFF4E8"
          opacity={0.85}
        />
        {/* Arch outline */}
        <path
          d={`M ${archInset} ${size - archInset}
             L ${archInset} ${size / 2}
             A ${size / 2 - archInset} ${size / 2 - archInset} 0 0 1 ${size - archInset} ${size / 2}
             L ${size - archInset} ${size - archInset}`}
          fill="none"
          stroke="#3F5F3D"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* Corner filler flowers */}
        <Flower
          cx={16}
          cy={size - 14}
          variant="filler"
          color="#B8C2A3"
          size={0.9}
          animate={false}
        />
        <Flower
          cx={size - 16}
          cy={size - 14}
          variant="filler"
          color="#6F7F55"
          size={0.9}
          animate={false}
        />
        <Flower cx={size / 2} cy={20} variant="filler" color="#C58A7A" size={0.9} animate={false} />
      </svg>

      {/* QR centered inside arch */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="p-2 bg-white/80 rounded-xl border border-sage/30">{children}</div>
      </div>
    </div>
  )
}
