import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import {
  Flower,
  OvalFrame,
  Petal,
  TornPaperFrame,
  VineDivider,
} from '../botanicals'
import { Bloom } from '../motion/Bloom'
import { RevealOnScroll } from '../motion/RevealOnScroll'
import { useGifts } from '../../hooks/useGifts'
import { purchaseGift } from '../../api/sheets'
import { buildPixPayload } from '../../utils/pix'
import type { Cota, Gift } from '../../types'
import type { Guest } from '../../types'
import { CONFIG } from '../../content.config'

interface Props {
  guest: Guest
}

type ModalStep = 'cotas' | 'pix' | 'confirm' | 'success'

interface PurchaseState {
  gift: Gift
  selectedCotas: Cota[]
  step: ModalStep
  cardMessage: string
  email: string
  submitting: boolean
  error: string | null
  pixCopied: boolean
}

// Asymmetric "hand-cut" corner radii — alternated per card so the grid
// feels like loose paper notes pinned in a garden.
const CORNER_VARIANTS = [
  'rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg',
  'rounded-tl-3xl rounded-br-3xl rounded-tr-lg rounded-bl-lg',
  'rounded-tr-3xl rounded-bl-3xl rounded-tl-md rounded-br-2xl',
  'rounded-bl-3xl rounded-tr-3xl rounded-br-md rounded-tl-2xl',
]

export function GiftShop({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const { gifts, loading, markCotasPurchased } = useGifts()
  const [purchase, setPurchase] = useState<PurchaseState | null>(null)

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
        cardMessage: purchase.cardMessage,
      })
      markCotasPurchased(purchase.selectedCotas.map((c) => c.cotaId))
      setPurchase({ ...purchase, step: 'success', submitting: false })
    } catch {
      setPurchase({ ...purchase, submitting: false, error: t('gifts.error') })
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
    <section
      id="gifts"
      className="relative overflow-hidden py-24 md:py-32 bg-peach-warm"
    >
      {/* Layered backgrounds */}
      <div className="absolute inset-0 bg-wash-peach opacity-50 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-paper opacity-30 pointer-events-none" aria-hidden />

      {/* Top vine */}
      <div className="absolute top-0 left-0 right-0 opacity-50 pointer-events-none" aria-hidden>
        <VineDivider width={1600} height={70} flowerCount={4} className="w-full h-auto" />
      </div>

      {/* Bottom vine (mirrored) */}
      <div
        className="absolute bottom-0 left-0 right-0 opacity-50 pointer-events-none rotate-180"
        aria-hidden
      >
        <VineDivider width={1600} height={70} flowerCount={4} className="w-full h-auto" />
      </div>

      {/* Floating edge petals */}
      <div className="absolute top-24 left-6 animate-float pointer-events-none" aria-hidden>
        <Petal color="#F7D8BD" size={28} rotation={-18} />
      </div>
      <div
        className="absolute top-40 right-10 animate-float pointer-events-none"
        style={{ animationDelay: '1.4s' }}
        aria-hidden
      >
        <Petal color="#DFB100" size={22} rotation={32} />
      </div>
      <div
        className="absolute bottom-32 left-12 animate-float pointer-events-none"
        style={{ animationDelay: '2.6s' }}
        aria-hidden
      >
        <Petal color="#C98262" size={20} rotation={48} />
      </div>
      <div
        className="absolute bottom-48 right-8 animate-float pointer-events-none"
        style={{ animationDelay: '0.8s' }}
        aria-hidden
      >
        <Petal color="#ADB897" size={26} rotation={-22} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-8">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-honey mb-3">
              {t('nav.gifts')}
            </p>
            <h2 className="font-display italic text-5xl md:text-6xl text-forest-deep">
              {t('gifts.title')}
            </h2>
            <p className="font-serif italic text-mauve mt-4 max-w-xl mx-auto leading-relaxed">
              {t('gifts.subtitle')}
            </p>
          </div>
        </RevealOnScroll>

        {loading ? (
          <div className="text-center py-16 text-mauve font-serif italic">…</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-9">
            {gifts.map((gift, i) => (
              <RevealOnScroll key={gift.giftId} delay={i * 0.05}>
                <GiftCard
                  gift={gift}
                  lang={lang}
                  cornerClass={CORNER_VARIANTS[i % CORNER_VARIANTS.length]}
                  useTorn={i % 4 === 3}
                  onOpen={() => openGift(gift)}
                  t={t}
                />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>

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

// ─── Gift card ───────────────────────────────────────────────────────────────

interface GiftCardProps {
  gift: Gift
  lang: 'pt' | 'en'
  cornerClass: string
  useTorn: boolean
  onOpen: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function GiftCard({ gift, lang, cornerClass, useTorn, onOpen, t }: GiftCardProps) {
  const isSoldOut = gift.available === 0
  const isPartial = gift.total > 1 && gift.available < gift.total && !isSoldOut
  const name = lang === 'pt' ? gift.name_pt : gift.name_en
  const description = lang === 'pt' ? gift.description_pt : gift.description_en
  const lowestPrice = Math.min(...gift.cotas.filter((c) => !c.purchased).map((c) => c.price))

  return (
    <div
      onClick={() => !isSoldOut && onOpen()}
      className={`group relative bg-peach-light/90 border border-sage/30 ${cornerClass} p-5 shadow-[0_4px_24px_rgba(78,120,79,0.08)] transition-all duration-300 ${
        isSoldOut
          ? 'opacity-80 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-[0_8px_30px_rgba(78,120,79,0.14)] hover:scale-[1.01]'
      }`}
    >
      {/* Paper texture overlay */}
      <div
        className={`absolute inset-0 bg-paper opacity-25 pointer-events-none ${cornerClass}`}
        aria-hidden
      />

      <div className="relative">
        {/* Photo */}
        <div className="flex justify-center mb-4">
          {useTorn ? (
            <TornPaperFrame
              imageSrc={gift.imageUrl}
              imageAlt={name}
              width={280}
              height={300}
              className="max-w-full h-auto"
            />
          ) : (
            <OvalFrame
              imageSrc={gift.imageUrl}
              imageAlt={name}
              width={280}
              height={300}
              className="max-w-full h-auto"
            />
          )}
        </div>

        {/* Sold out stamp */}
        {isSoldOut && (
          <div
            className="absolute top-2 right-2 pointer-events-none flex flex-col items-center"
            aria-hidden
          >
            <svg
              width="86"
              height="86"
              viewBox="-50 -50 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ opacity: 0.5 }}
              className="-rotate-12"
            >
              <Flower
                cx={0}
                cy={0}
                variant="wild-rose"
                color="#AA9DA9"
                centerColor="#AA9DA9"
                size={2.4}
                animate={false}
              />
            </svg>
            <span className="-mt-2 font-serif italic text-sm text-mauve tracking-wide -rotate-6">
              {t('gifts.soldOutStamp')}
            </span>
          </div>
        )}

        {/* Title + description */}
        <h3 className="font-display text-xl text-forest-deep leading-snug">{name}</h3>
        {description && (
          <p className="font-serif italic text-sm text-mauve mt-1 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Price + availability */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-mauve/70">
              {gift.total > 1 ? t('gifts.fromPrice') : t('gifts.price')}
            </p>
            <p className="font-display text-2xl text-honey leading-none mt-1">
              R$ {Number.isFinite(lowestPrice) ? lowestPrice : gift.cotas[0]?.price}
            </p>
          </div>

          {!isSoldOut && (
            <>
              {isPartial ? (
                <span className="bg-honey/20 text-forest-deep font-sans text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-honey/40">
                  {t('gifts.partiallyAvailable', {
                    available: gift.available,
                    total: gift.total,
                  })}
                </span>
              ) : (
                <span className="bg-sage/40 text-forest-deep font-sans text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                  {t('gifts.available')}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
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
  onEmailChange: (v: string) => void
  onConfirm: () => void
  onCopyPix: () => void
  pixPayload: string
  totalAmount: number
}

function GiftModal(props: ModalProps) {
  const { t } = useTranslation()
  const { purchase, lang } = props
  const { gift, step, selectedCotas, cardMessage, email, submitting, error, pixCopied } = purchase
  const availableCotas = gift.cotas
  const giftName = lang === 'pt' ? gift.name_pt : gift.name_en

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-forest-deep/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && props.onClose()}
    >
      <div
        className="relative bg-peach-light w-full sm:max-w-md rounded-t-3xl sm:rounded-[28px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(63,96,65,0.25)] border border-sage/30"
      >
        {/* Paper texture inside modal */}
        <div
          className="absolute inset-0 bg-paper opacity-25 pointer-events-none rounded-t-3xl sm:rounded-[28px]"
          aria-hidden
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="pr-4">
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-honey mb-1">
                {step === 'success' ? t('gifts.successKicker') : t('gifts.stepKicker')}
              </p>
              <h3 className="font-display italic text-2xl text-forest-deep">{giftName}</h3>
              {step !== 'success' && (
                <p className="font-serif italic text-sm text-mauve mt-1">
                  {lang === 'pt' ? gift.description_pt : gift.description_en}
                </p>
              )}
            </div>
            <button
              onClick={props.onClose}
              className="text-mauve/70 hover:text-forest-deep transition-colors shrink-0 mt-1"
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
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-mauve mb-4">
                {t('gifts.cotasTitle')}
              </p>

              <div className="flex flex-wrap gap-2.5 mb-6">
                {availableCotas.map((cota) => {
                  const isSold = cota.purchased
                  const isSelected = !!selectedCotas.find((c) => c.cotaId === cota.cotaId)
                  const label = lang === 'pt' ? cota.label_pt : cota.label_en

                  const baseChip =
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans text-sm transition-all'
                  let chipClass = ''

                  if (isSold) {
                    chipClass = `${baseChip} bg-sage/20 text-mauve line-through cursor-not-allowed opacity-60`
                  } else if (isSelected) {
                    chipClass = `${baseChip} bg-forest-deep text-peach-light shadow-[0_4px_14px_rgba(63,96,65,0.25)]`
                  } else {
                    chipClass = `${baseChip} bg-white/60 border border-sage/40 text-forest hover:border-forest/40 hover:bg-white/80`
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
                            fill="#F7D8BD"
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
                              ? 'text-mauve'
                              : 'text-honey font-semibold'
                        }
                      >
                        · R$ {cota.price}
                      </span>
                    </button>
                  )
                })}
              </div>

              {selectedCotas.length > 0 && (
                <p className="text-center font-serif italic text-base text-forest-deep mb-5">
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
              <p className="font-serif italic text-sm text-mauve text-center mb-6 leading-relaxed">
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
                    fgColor="#3F6041"
                    bgColor="transparent"
                  />
                </ArchQrFrame>
              </div>

              <p className="text-center font-display text-3xl text-honey mb-1">
                R$ {props.totalAmount.toFixed(2)}
              </p>
              <p className="text-center font-serif italic text-xs text-mauve mb-6">
                {selectedCotas
                  .map((c) => (lang === 'pt' ? c.label_pt : c.label_en))
                  .join(' + ')}
              </p>

              <button
                onClick={props.onCopyPix}
                className="w-full mb-3 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-sage/50 text-forest hover:bg-sage/20 font-sans text-xs tracking-widest uppercase transition-colors"
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
                  <span className="animate-bloom inline-block text-forest-deep">
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
                    className="font-sans text-xs tracking-widest uppercase text-mauve hover:text-forest-deep transition-colors"
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
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-mauve block mb-2">
                    {t('gifts.cardMessage')}
                  </label>
                  <textarea
                    value={cardMessage}
                    onChange={(e) => props.onCardMessageChange(e.target.value)}
                    placeholder={t('gifts.cardPlaceholder')}
                    rows={4}
                    className="w-full px-5 py-4 rounded-2xl border border-sage/40 bg-white/70 font-serif italic text-base text-forest-deep placeholder:text-mauve placeholder:italic focus:outline-none focus:border-forest/60 focus:bg-white/90 resize-none transition-colors"
                  />
                </div>

                <div>
                  <label className="font-sans text-[10px] tracking-[0.3em] uppercase text-mauve block mb-2">
                    {t('gifts.yourEmail')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => props.onEmailChange(e.target.value)}
                    placeholder={t('gifts.emailPlaceholder')}
                    required
                    className="w-full px-5 py-3.5 rounded-2xl border border-sage/40 bg-white/70 font-serif italic text-base text-forest-deep placeholder:text-mauve placeholder:italic focus:outline-none focus:border-forest/60 focus:bg-white/90 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-terracotta text-center mb-4 font-serif italic">
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
                  className="font-sans text-xs tracking-widest uppercase text-mauve hover:text-forest-deep transition-colors"
                >
                  {t('gifts.back')}
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
                    <Flower cx={-60} cy={0} variant="daisy" color="#DC9A32" size={1.1} animate={false} />
                  </Bloom>
                  <Bloom delay={0.15}>
                    <Flower
                      cx={-25}
                      cy={-12}
                      variant="cosmos"
                      color="#C98262"
                      size={1.2}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.3}>
                    <Flower
                      cx={10}
                      cy={6}
                      variant="wild-rose"
                      color="#DFB100"
                      size={1.3}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.45}>
                    <Flower
                      cx={45}
                      cy={-8}
                      variant="anemone"
                      color="#AA9DA9"
                      size={1.1}
                      animate={false}
                    />
                  </Bloom>
                  <Bloom delay={0.6}>
                    <Flower cx={75} cy={4} variant="filler" color="#ADB897" size={1.2} animate={false} />
                  </Bloom>
                </svg>
              </div>

              {/* Drifting petals */}
              <div
                className="absolute top-4 left-6 animate-float pointer-events-none"
                aria-hidden
              >
                <Petal color="#F7D8BD" size={18} rotation={-22} />
              </div>
              <div
                className="absolute top-8 right-8 animate-float pointer-events-none"
                style={{ animationDelay: '1s' }}
                aria-hidden
              >
                <Petal color="#DFB100" size={14} rotation={28} />
              </div>

              <h4 className="font-display italic text-3xl text-forest-deep mb-2">
                {t('gifts.successTitle')}
              </h4>
              <p className="font-serif italic text-mauve mb-6 leading-relaxed max-w-xs mx-auto">
                {t('gifts.successText')}
              </p>

              {/* Receipt */}
              <div className="bg-white/60 border border-sage/30 rounded-2xl p-5 text-left mb-6">
                <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-mauve mb-2">
                  {t('gifts.summary')}
                </p>
                <p className="font-display italic text-xl text-forest-deep">{giftName}</p>
                {selectedCotas.map((c) => (
                  <div key={c.cotaId} className="flex justify-between mt-1.5">
                    <span className="font-serif italic text-sm text-mauve">
                      {lang === 'pt' ? c.label_pt : c.label_en}
                    </span>
                    <span className="font-sans text-sm font-semibold text-honey">R$ {c.price}</span>
                  </div>
                ))}
                <div className="border-t border-sage/30 mt-3 pt-2 flex justify-between">
                  <span className="font-sans text-xs uppercase tracking-widest text-forest-deep">
                    {t('gifts.total')}
                  </span>
                  <span className="font-display text-lg text-honey">
                    R$ {props.totalAmount.toFixed(2)}
                  </span>
                </div>
                {cardMessage && (
                  <p className="mt-4 font-serif italic text-sm text-mauve border-l-2 border-sage/60 pl-3">
                    “{cardMessage}”
                  </p>
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
      className={`group inline-flex w-full items-center justify-center gap-2 rounded-full bg-forest-deep px-8 py-3 font-sans text-sm tracking-widest uppercase text-peach-light transition-all duration-300 hover:bg-forest-deep/90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
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
          fill="#F7D8BD"
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
          fill="#FAE6D4"
          opacity={0.85}
        />
        {/* Arch outline */}
        <path
          d={`M ${archInset} ${size - archInset}
             L ${archInset} ${size / 2}
             A ${size / 2 - archInset} ${size / 2 - archInset} 0 0 1 ${size - archInset} ${size / 2}
             L ${size - archInset} ${size - archInset}`}
          fill="none"
          stroke="#4E784F"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* Corner filler flowers */}
        <Flower cx={16} cy={size - 14} variant="filler" color="#ADB897" size={0.9} animate={false} />
        <Flower
          cx={size - 16}
          cy={size - 14}
          variant="filler"
          color="#DC9A32"
          size={0.9}
          animate={false}
        />
        <Flower cx={size / 2} cy={20} variant="filler" color="#DFB100" size={0.9} animate={false} />
      </svg>

      {/* QR centered inside arch */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="p-2 bg-white/80 rounded-xl border border-sage/30">{children}</div>
      </div>
    </div>
  )
}
