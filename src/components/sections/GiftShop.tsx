import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { QRCode } from 'react-qrcode-logo'
import { Flower, Petal } from '../botanicals'
import { Bloom } from '../motion/Bloom'
import { useReducedMotion } from '../motion/useReducedMotion'
import { GIFTS_TITLE_TOP, GiftsTitle } from '../gifts/GiftsTitle'
import { DeskFlowers } from './passport/DeskFlowers'
import { RSVP_SCENE_VH } from './RSVP'
import { deskLayout, isDesk, isHand, passportGeometry } from './passport/geometry'
import { useGifts } from '../../hooks/useGifts'
import { purchaseGift, submitCard } from '../../api/sheets'
import {
  CARD_ASPECT,
  CARD_THEMES,
  MessageCard,
  getCardTheme,
  type CardThemeId,
} from '../gifts/cardThemes'
import { buildPixPayload } from '../../utils/pix'
import { loadPaypalSdk, paypalEnabled, toEur, totalEur } from '../../utils/paypal'
import type { Cota, Gift } from '../../types'
import type { Guest } from '../../types'
import { guestName } from '../../utils/guest'
import { groupCotas, setGroupQuantity, summarizeCotas, type CotaGroup } from '../../utils/cotas'
import { CONFIG } from '../../content.config'

interface Props {
  guest: Guest
}

type ModalStep = 'cotas' | 'pix' | 'paypal' | 'confirm' | 'card' | 'success'

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
  paidWith: 'pix' | 'paypal'
}

export function GiftShop({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const { gifts, loading, markCotasPurchased } = useGifts()
  const [purchase, setPurchase] = useState<PurchaseState | null>(null)
  // Touch: one polaroid lies turned over at a time; tapping another turns the
  // first back.
  const [flippedId, setFlippedId] = useState<string | null>(null)
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
      cardFrom: guestName(guest),
      cardSent: false,
      email: '',
      submitting: false,
      error: null,
      pixCopied: false,
      paidWith: 'pix',
    })
  }

  function setQuantity(group: CotaGroup, qty: number) {
    if (!purchase) return
    setPurchase({
      ...purchase,
      selectedCotas: setGroupQuantity(purchase.selectedCotas, group, qty),
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

  // The guest approved the order in PayPal's window; the Apps Script checks
  // the cotas are still free and only then captures the payment.
  async function handlePaypalApproved(orderId: string) {
    if (!purchase) return
    setPurchase({ ...purchase, submitting: true, error: null })
    try {
      const res = await purchaseGift({
        guestId: guest.guestId,
        giftId: purchase.gift.giftId,
        giftName: lang === 'pt' ? purchase.gift.name_pt : purchase.gift.name_en,
        selectedCotaIds: purchase.selectedCotas.map((c) => c.cotaId),
        selectedCotaLabels: purchase.selectedCotas.map((c) => c.label_pt),
        totalPrice: totalAmount(purchase.selectedCotas),
        guestEmail: '',
        cardMessage: '',
        paymentMethod: 'paypal',
        paypalOrderId: orderId,
      })
      if (!res.success) throw new Error(res.error)
      markCotasPurchased(purchase.selectedCotas.map((c) => c.cotaId))
      setPurchase({ ...purchase, step: 'card', paidWith: 'paypal', submitting: false })
    } catch {
      setPurchase({ ...purchase, submitting: false, error: t('gifts.paypalError') })
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
    // No background on the section itself: its opening screen lies over the
    // RSVP's last one and must stay unseen until it reaches the top.
    <section id="gifts" className="relative">
      {reduced ? (
        <div className="bg-peach bg-paper mx-auto max-w-5xl px-6 pt-32 pb-16 text-center md:pt-48">
          <p className="font-sans text-amber-deep mb-6 text-[0.65rem] tracking-[0.4em] uppercase">
            {t('nav.gifts')}
          </p>
          <h2 className="font-display text-title text-4xl md:text-5xl">{t('gifts.title')}</h2>
        </div>
      ) : null}

      <GiftsDesk opening={!reduced}>
        <div className="mx-auto max-w-6xl px-4 pb-32 sm:px-8 md:pb-48">
          {loading ? (
            <div className="text-title py-16 text-center font-serif">…</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-16 lg:gap-y-14">
              {gifts.map((gift, i) => (
                <div key={gift.giftId}>
                  <GiftCard
                    gift={gift}
                    index={i}
                    lang={lang}
                    flipped={flippedId === gift.giftId}
                    onFlip={() => setFlippedId(gift.giftId)}
                    onOpen={() => openGift(gift)}
                    t={t}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </GiftsDesk>

      {purchase && (
        <GiftModal
          purchase={purchase}
          lang={lang}
          onClose={() => setPurchase(null)}
          onSetQuantity={setQuantity}
          onProceedToPixFromCotas={() => setPurchase({ ...purchase, step: 'pix' })}
          onProceedToConfirm={() => setPurchase({ ...purchase, step: 'confirm' })}
          onProceedToPaypal={() => setPurchase({ ...purchase, step: 'paypal', error: null })}
          onBackToPix={() => setPurchase({ ...purchase, step: 'pix', error: null })}
          onPaypalApproved={handlePaypalApproved}
          onPaypalFailed={() => setPurchase({ ...purchase, error: t('gifts.paypalError') })}
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
  /** Touch screens: this card is the one turned over (the parent keeps just one). */
  flipped: boolean
  onFlip: () => void
  onOpen: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function GiftCard({ gift, index, lang, flipped, onFlip, onOpen, t }: GiftCardProps) {
  const [imageFailed, setImageFailed] = useState(!gift.imageUrl)
  // No hover on touch screens: the first tap turns the polaroid over (the
  // parent turns any other one back), the next one (on its back) opens the gift.
  const [hover] = useState(() => window.matchMedia('(hover: hover)').matches)
  const [hovered, setHovered] = useState(false)
  const turned = hover ? hovered : flipped
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
  const name = lang === 'pt' ? gift.name_pt : gift.name_en
  const description = lang === 'pt' ? gift.description_pt : gift.description_en
  const lowestPrice = Math.min(...gift.cotas.filter((c) => !c.purchased).map((c) => c.price))

  const onClick = () => {
    if (!hover && !flipped) return onFlip()
    if (!isSoldOut) onOpen()
  }
  const face = 'absolute inset-0 rounded-[3px] [backface-visibility:hidden]'

  return (
    <button
      type="button"
      onClick={onClick}
      // Turned over by hover or keyboard focus (mouse), or by the first tap
      // (touch).
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      onFocus={(e) => hover && e.currentTarget.matches(':focus-visible') && setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-disabled={isSoldOut}
      aria-label={name}
      className={`group mx-auto block w-full max-w-[14rem] text-left [perspective:1200px] ${
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
            className={`${face} flex flex-col bg-white p-1.5 pb-0 sm:p-2.5 sm:pb-0 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] ${
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
                  // The generated paper is a darker peach than the card's cream: lift it
                  // to about the placeholder's tone, without regenerating every image.
                  style={{ filter: 'brightness(1.03) saturate(0.96)' }}
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
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-1 text-center">
              <h3 className="font-sans text-[0.8rem] text-title leading-snug line-clamp-2 sm:text-base">
                {name}
              </h3>
              {!isSoldOut && (
                <p className="font-sans text-amber-deep mt-0.5 text-[0.75rem] tabular-nums sm:text-sm">
                  {gift.total > 1 && <span className="text-title/70">{t('gifts.fromPrice')} </span>}
                  R$ {Number.isFinite(lowestPrice) ? lowestPrice : gift.cotas[0]?.price}
                </p>
              )}
            </div>
          </motion.div>

          {/* Back: what it is and what it costs. */}
          <motion.div
            className={`${face} bg-[#FDFBF6] bg-paper flex flex-col p-3 sm:p-5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4)] [transform:rotateY(180deg)]`}
            style={{ visibility: backShown }}
          >
            <p className="font-sans text-sm text-title leading-snug sm:text-lg">{name}</p>
            <div className="mt-2 h-px w-10 bg-amber/40 sm:mt-3" />
            {description && (
              <p className="font-serif text-[0.8rem] text-title mt-2 leading-snug line-clamp-[6] sm:mt-3 sm:text-[0.9rem] sm:leading-relaxed sm:line-clamp-[7]">
                {description}
              </p>
            )}
            <div className="mt-auto pt-2 sm:pt-4">
              {isSoldOut ? (
                <p className="font-sans text-[0.6rem] tracking-[0.4em] uppercase text-title">
                  {t('gifts.soldOutStamp')}
                </p>
              ) : (
                <>
                  <p className="font-sans tabular-nums text-base text-amber-deep sm:text-xl">
                    {gift.total > 1 && (
                      <span className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-title mr-2">
                        {t('gifts.fromPrice')}
                      </span>
                    )}
                    R$ {Number.isFinite(lowestPrice) ? lowestPrice : gift.cotas[0]?.price}
                  </p>
                  <p className="font-sans text-[0.6rem] tracking-[0.3em] uppercase text-amber-deep mt-2 sm:mt-4">
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
  onSetQuantity: (group: CotaGroup, qty: number) => void
  onProceedToPixFromCotas: () => void
  onProceedToConfirm: () => void
  onProceedToPaypal: () => void
  onBackToPix: () => void
  onPaypalApproved: (orderId: string) => Promise<void>
  onPaypalFailed: () => void
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
    paidWith,
  } = purchase
  const availableCotas = gift.cotas
  const giftName = lang === 'pt' ? gift.name_pt : gift.name_en
  const eurTotal = totalEur(selectedCotas.map((c) => c.price))
  const priceLabel = (brl: number) => (paidWith === 'paypal' ? `€ ${toEur(brl)}` : `R$ ${brl}`)

  return (
    <div
      // (Not closed by a click outside: only by the X, so a stray tap doesn't lose a card.)
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-forest-deep/40 backdrop-blur-sm"
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

              <ul className="mb-6 divide-y divide-sage/25 rounded-2xl border border-sage/30 bg-white/50">
                {groupCotas(availableCotas).map((group) => {
                  const free = group.cotas.filter((c) => !c.purchased).length
                  const qty = selectedCotas.filter((c) =>
                    group.cotas.some((g) => g.cotaId === c.cotaId)
                  ).length
                  const label = lang === 'pt' ? group.label_pt : group.label_en
                  const stepClass =
                    'flex h-9 w-9 items-center justify-center rounded-full border border-sage/50 font-sans text-lg leading-none text-title transition-colors enabled:hover:border-forest/50 enabled:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed'

                  return (
                    <li key={group.key} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-sans text-sm text-title ${free === 0 ? 'line-through opacity-60' : ''}`}
                        >
                          {label}
                        </p>
                        <p className="font-sans text-xs text-title/80">
                          <span className="font-semibold text-amber-deep">R$ {group.price}</span>
                          {free === 0
                            ? ` · ${t('gifts.soldOut')}`
                            : group.cotas.length > 1
                              ? ` · ${t('gifts.cotasLeft', { count: free })}`
                              : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className={stepClass}
                          disabled={qty === 0}
                          aria-label={t('gifts.removeOne', { label })}
                          onClick={() => props.onSetQuantity(group, qty - 1)}
                        >
                          −
                        </button>
                        <span
                          className="w-6 text-center font-sans text-base tabular-nums text-title"
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          className={stepClass}
                          disabled={qty >= free}
                          aria-label={t('gifts.addOne', { label })}
                          onClick={() => props.onSetQuantity(group, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>

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
                {summarizeCotas(selectedCotas, lang)}
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

              {paypalEnabled() && (
                <div className="mt-5 border-t border-sage/30 pt-4 text-center">
                  <p className="font-serif text-xs text-title mb-2">{t('gifts.paypalOffer')}</p>
                  <button
                    type="button"
                    onClick={props.onProceedToPaypal}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-sage/50 text-title hover:bg-sage/20 font-sans text-xs tracking-widest uppercase transition-colors"
                  >
                    {t('gifts.paypalButton', { amount: eurTotal })}
                  </button>
                </div>
              )}

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

          {/* ── Step: PayPal (guests abroad, charged in euros) ── */}
          {step === 'paypal' && (
            <>
              <p className="font-serif text-sm text-title text-center mb-5 leading-relaxed">
                {t('gifts.paypalInstructions')}
              </p>

              <p className="text-center font-sans tabular-nums text-3xl text-amber-deep mb-1">
                € {eurTotal.toFixed(2)}
              </p>
              <p className="text-center font-serif text-xs text-title mb-6">
                {summarizeCotas(selectedCotas, lang)}
              </p>

              {submitting ? (
                <p className="text-center font-sans text-sm tracking-widest uppercase text-title py-6 animate-breath">
                  {t('gifts.confirming')}
                </p>
              ) : (
                <PaypalCheckout
                  amountEur={eurTotal}
                  description={giftName}
                  onApproved={props.onPaypalApproved}
                  onFailed={props.onPaypalFailed}
                />
              )}

              {error && (
                <p role="alert" className="text-sm text-terracotta text-center mt-4 font-serif">
                  {error}
                </p>
              )}

              {!submitting && (
                <div className="mt-3 text-center">
                  <button
                    onClick={props.onBackToPix}
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
                <ZoomableCard
                  theme={getCardTheme(cardTheme)}
                  message={cardMessage}
                  from={cardFrom}
                  placeholder={t('gifts.cardPlaceholder')}
                />
                <p className="mt-1.5 text-center font-sans text-[10px] tracking-[0.3em] uppercase text-title/70">
                  {t('gifts.cardEnlargeHint')}
                </p>
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
                {groupCotas(selectedCotas).map((g) => (
                  <div key={g.key} className="flex justify-between mt-1.5">
                    <span className="font-serif text-sm text-title">
                      {g.cotas.length > 1 ? `${g.cotas.length}× ` : ''}
                      {lang === 'pt' ? g.label_pt : g.label_en}
                    </span>
                    <span className="font-sans text-sm font-semibold text-amber-deep">
                      {priceLabel(g.price * g.cotas.length)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-sage/30 mt-3 pt-2 flex justify-between">
                  <span className="font-sans text-xs uppercase tracking-widest text-title">
                    {t('gifts.total')}
                  </span>
                  <span className="font-sans tabular-nums text-lg text-amber-deep">
                    {paidWith === 'paypal'
                      ? `€ ${eurTotal.toFixed(2)}`
                      : `R$ ${props.totalAmount.toFixed(2)}`}
                  </span>
                </div>
                {cardSent && (
                  <div className="mt-4">
                    <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-title mb-2">
                      {t('gifts.cardSent')}
                    </p>
                    <ZoomableCard
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

// ─── Message card, enlarged ──────────────────────────────────────────────────

/** The card as a button: it opens bigger over the page, for a better preview. */
function ZoomableCard(props: ComponentProps<typeof MessageCard>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('gifts.cardEnlarge')}
        className="block w-full cursor-zoom-in"
      >
        <MessageCard {...props} />
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('gifts.cardEnlarge')}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-forest-deep/70 p-3 backdrop-blur-sm sm:p-8"
          >
            {/* As wide as the screen allows, and no taller than it. */}
            <div
              className="w-full"
              style={{
                maxWidth: `min(1100px, calc((100dvh - 1.5rem) * ${CARD_ASPECT.toFixed(3)}))`,
              }}
            >
              <MessageCard {...props} />
            </div>
            <button
              type="button"
              aria-label={t('gifts.close')}
              className="absolute right-3 top-3 text-peach-light/90 hover:text-peach-light"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>,
          document.body
        )}
    </>
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

// ─── PayPal buttons ──────────────────────────────────────────────────────────

interface PaypalCheckoutProps {
  amountEur: number
  description: string
  onApproved: (orderId: string) => Promise<void>
  onFailed: () => void
}

// PayPal's own buttons (PayPal account, or card as a guest), rendered into a
// div. They only create and approve the order; the Apps Script captures it.
function PaypalCheckout({ amountEur, description, onApproved, onFailed }: PaypalCheckoutProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  // The buttons outlive renders; they call whatever the latest handlers are.
  const handlers = useRef({ onApproved, onFailed })
  useEffect(() => {
    handlers.current = { onApproved, onFailed }
  })

  useEffect(() => {
    let cancelled = false
    let buttons: { close: () => Promise<void> } | null = null
    loadPaypalSdk()
      .then((paypal) => {
        if (cancelled || !ref.current) return
        const b = paypal.Buttons({
          style: { layout: 'vertical', shape: 'pill', color: 'gold', label: 'pay', height: 44 },
          createOrder: (_data, actions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: description.slice(0, 127),
                  amount: { currency_code: 'EUR', value: amountEur.toFixed(2) },
                },
              ],
              application_context: { shipping_preference: 'NO_SHIPPING' },
            }),
          onApprove: (data) => handlers.current.onApproved(data.orderID),
          onError: () => handlers.current.onFailed(),
        })
        buttons = b
        return b.render(ref.current).then(() => !cancelled && setStatus('ready'))
      })
      .catch(() => !cancelled && setStatus('failed'))
    return () => {
      cancelled = true
      buttons?.close().catch(() => {})
    }
  }, [amountEur, description])

  return (
    <div>
      {status === 'loading' && (
        <p className="text-center font-serif text-sm text-title py-4">{t('gifts.paypalLoading')}</p>
      )}
      {status === 'failed' && (
        <p role="alert" className="text-center font-serif text-sm text-terracotta py-4">
          {t('gifts.paypalLoadError')}
        </p>
      )}
      <div ref={ref} className="relative z-0" />
    </div>
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

// Scroll (in screens) over which the title rises from the middle of the
// desk to the top, before the page goes on.
const RISE_VH = 0.6
// From the risen title's middle to the top of the gifts.
const TITLE_TO_GIFTS = 84
// The title's size once it has risen into the list's header.
const HEADER_SCALE = 0.5

/**
 * The gift list on the desk the RSVP leaves behind. Its first screen — the
 * desk's wildflowers and the list's title in the middle — lies over the
 * RSVP's last one and shows only once it reaches the top, where it is the
 * same picture the RSVP ends on. It then stays a moment while the title
 * rises to the top, the gifts coming up under it; from there the list
 * scrolls like a page, over the desk's wildflowers, which stay put.
 */
function GiftsDesk({ opening, children }: { opening: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: arrival } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  })
  const opacity = useTransform(arrival, (v) => (v >= 0.999 ? 1 : 0))
  const [w, h] = [window.innerWidth, window.innerHeight]
  // Linear, so the gifts (moving with the scroll) never catch the title up.
  const { scrollYProgress: rising } = useScroll({
    target: ref,
    offset: ['start start', `start -${RISE_VH * 100}vh`],
  })
  const titleScale = useTransform(rising, (v) => 1 + (HEADER_SCALE - 1) * v)
  const { scrollYProgress: ending } = useScroll({
    target: ref,
    offset: ['end end', 'end start'],
  })
  // Past the list's end the flowers and the header leave with it, as the
  // page goes on.
  const flowersY = useTransform(ending, (v) => -v * h)
  // The desk's wildflowers, where the RSVP left them (not on a phone, where
  // the passport and the invitation are held in the hand).
  const deskGeo = useMemo(
    () => (isDesk(w, h) && !isHand(w, h) ? passportGeometry(w, h) : null),
    [w, h]
  )
  if (!opening) return <div className="bg-peach bg-paper">{children}</div>
  return (
    <motion.div
      ref={ref}
      className="bg-peach bg-paper relative"
      style={{
        marginTop: '-100vh',
        zIndex: 42,
        opacity,
        // The paper's grain lines up with the RSVP's, whose section starts
        // RSVP_SCENE_VH above this one: no shift in the paper at the
        // hand-over.
        backgroundPosition: `0 -${RSVP_SCENE_VH}vh`,
      }}
    >
      {/* The wildflowers stay on the screen the whole length of the list.
          Fixed on the screen, as the RSVP's copy (see there): the two are in
          the same place whichever shows at the hand-over. Once the list ends
          they scroll away with it. */}
      {deskGeo && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{ y: flowersY }}
        >
          <DeskFlowers g={deskGeo} desk={deskLayout(deskGeo)} />
        </motion.div>
      )}
      {/* Where the Nav's "Gifts" link lands: the title risen to the top, the
          gifts below it (`rising` done, a hair past so it is surely done). */}
      <div
        id="gifts-list"
        aria-hidden
        className="pointer-events-none absolute h-px w-px"
        style={{ top: `calc(${RISE_VH * 100}vh + 2px)` }}
      />
      {/* Room for the title to rise in, then the gifts: they come up under
          the rising title and, once it has risen, start just below it. */}
      <div
        aria-hidden
        style={{ height: `calc(${RISE_VH * 100}svh + ${GIFTS_TITLE_TOP + TITLE_TO_GIFTS}px)` }}
      />
      <div className="relative">{children}</div>
      {/* The title: in the middle of the desk, then risen and smaller, held
          at the top as the list's header the whole length of the list, on
          a band of paper the gifts pass under. Fixed on the screen like the
          flowers (and the RSVP's copy), so the hand-over can't move it; it
          leaves with the list's end. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-20"
        style={{ y: flowersY }}
      >
        <div className="relative h-[100svh] overflow-hidden">
          <motion.div
            className="absolute inset-x-0 top-0"
            style={{
              // Opaque to a little under the title, then a short fade.
              height: GIFTS_TITLE_TOP + 60,
              opacity: rising,
              background: `linear-gradient(to bottom, #FBFAF8 0, #FBFAF8 ${GIFTS_TITLE_TOP + 34}px, rgba(251, 250, 248, 0) 100%)`,
            }}
          />
          <GiftsTitle rise={rising} scale={titleScale} />
        </div>
      </motion.div>
    </motion.div>
  )
}
