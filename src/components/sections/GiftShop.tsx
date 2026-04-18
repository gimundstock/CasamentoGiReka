import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCode } from 'react-qrcode-logo'
import { WildflowerDecor } from '../ui/WildflowerDecor'
import { useGifts } from '../../hooks/useGifts'
import { purchaseGift } from '../../api/sheets'
import { buildPixPayload } from '../../utils/pix'
import type { Gift, Cota } from '../../types'
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

export function GiftShop({ guest }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as 'pt' | 'en'
  const { gifts, loading, markCotasPurchased } = useGifts()
  const [purchase, setPurchase] = useState<PurchaseState | null>(null)

  function openGift(gift: Gift) {
    const availableCotas = gift.cotas.filter((c) => !c.purchased)
    if (availableCotas.length === 0) return

    // Single-cota gift: skip selector, go straight to PIX
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

  const giftStatusLabel = (gift: Gift) => {
    if (gift.available === 0) return t('gifts.soldOut')
    if (gift.total > 1 && gift.available < gift.total)
      return t('gifts.partiallyAvailable', { available: gift.available, total: gift.total })
    return t('gifts.available')
  }

  const giftStatusColor = (gift: Gift) => {
    if (gift.available === 0) return 'text-mauve/60'
    if (gift.total > 1 && gift.available < gift.total) return 'text-amber'
    return 'text-forest'
  }

  return (
    <section id="gifts" className="relative bg-peach/30 py-24 overflow-hidden">
      <WildflowerDecor variant="top" className="h-16" opacity={0.2} />

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="text-center mb-16">
          <p className="font-sans text-xs tracking-widest uppercase text-amber mb-3">
            {t('nav.gifts')}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-forest italic">{t('gifts.title')}</h2>
          <p className="font-sans text-sm text-mauve mt-3 max-w-lg mx-auto leading-relaxed">
            {t('gifts.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-mauve font-sans text-sm">...</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gifts.map((gift) => {
              const isSoldOut = gift.available === 0
              return (
                <div
                  key={gift.giftId}
                  onClick={() => !isSoldOut && openGift(gift)}
                  className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
                    isSoldOut
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-[4/3] bg-peach/50 overflow-hidden relative">
                    <img
                      src={gift.imageUrl}
                      alt={lang === 'pt' ? gift.name_pt : gift.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement
                        el.style.display = 'none'
                      }}
                    />
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="font-sans text-sm tracking-widest uppercase text-mauve/80 bg-white/90 px-4 py-2 rounded-full">
                          {t('gifts.soldOut')}
                        </span>
                      </div>
                    )}
                    {/* Petal decoration */}
                    <div className="absolute top-3 right-3 opacity-40 group-hover:opacity-60 transition-opacity">
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="#ADB897">
                        <circle cx="14" cy="14" r="3" />
                        <ellipse cx="14" cy="6" rx="3" ry="5" />
                        <ellipse cx="22" cy="14" rx="5" ry="3" />
                        <ellipse cx="14" cy="22" rx="3" ry="5" />
                        <ellipse cx="6" cy="14" rx="5" ry="3" />
                      </svg>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-xl text-forest mb-1">
                      {lang === 'pt' ? gift.name_pt : gift.name_en}
                    </h3>
                    <p className="font-sans text-xs text-mauve mb-3 leading-relaxed line-clamp-2">
                      {lang === 'pt' ? gift.description_pt : gift.description_en}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-xs tracking-wide ${giftStatusColor(gift)}`}>
                        {giftStatusLabel(gift)}
                      </span>
                      {gift.total > 1 && (
                        <span className="font-sans text-xs text-mauve/60">
                          {gift.cotas
                            .filter((c) => !c.purchased)
                            .map((c) => `R$ ${c.price}`)
                            .join(' · ')}
                        </span>
                      )}
                      {gift.total === 1 && (
                        <span className="font-sans text-sm font-semibold text-amber">
                          R$ {gift.cotas[0]?.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
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

      <WildflowerDecor variant="bottom" className="h-16 mt-8" opacity={0.2} />
    </section>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────

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
  const availableCotas = gift.cotas.filter((c) => !c.purchased)
  const giftName = lang === 'pt' ? gift.name_pt : gift.name_en

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && props.onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-forest">{giftName}</h3>
            {step !== 'success' && (
              <p className="font-sans text-xs text-mauve mt-1">
                {lang === 'pt' ? gift.description_pt : gift.description_en}
              </p>
            )}
          </div>
          <button onClick={props.onClose} className="text-mauve/60 hover:text-mauve ml-4 shrink-0">
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
            <p className="font-sans text-xs tracking-widest uppercase text-mauve mb-4">
              {t('gifts.cotasTitle')}
            </p>
            <div className="space-y-3 mb-6">
              {availableCotas.map((cota) => {
                const isSelected = !!selectedCotas.find((c) => c.cotaId === cota.cotaId)
                return (
                  <button
                    key={cota.cotaId}
                    type="button"
                    onClick={() => props.onToggleCota(cota)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-forest bg-forest/5'
                        : 'border-sage/40 hover:border-forest/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-forest bg-forest' : 'border-sage'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-sans text-sm text-forest text-left">
                        {lang === 'pt' ? cota.label_pt : cota.label_en}
                      </span>
                    </div>
                    <span className="font-sans text-sm font-semibold text-amber shrink-0 ml-2">
                      R$ {cota.price}
                    </span>
                  </button>
                )
              })}
            </div>

            {selectedCotas.length > 0 && (
              <p className="text-center font-sans text-sm text-forest mb-4">
                {t('gifts.totalSelected', { amount: props.totalAmount.toFixed(2) })}
              </p>
            )}

            <button
              onClick={props.onProceedToPixFromCotas}
              disabled={selectedCotas.length === 0}
              className="w-full py-3.5 rounded-full bg-forest text-peach font-sans text-xs tracking-widest uppercase hover:bg-forest/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedCotas.length === 0 ? t('gifts.noCotas') : t('gifts.proceed')}
            </button>
          </>
        )}

        {/* ── Step: PIX QR ── */}
        {step === 'pix' && (
          <>
            <p className="font-sans text-xs text-mauve text-center mb-6 leading-relaxed">
              {t('gifts.pixInstructions')}
            </p>

            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white border border-sage/30 rounded-2xl inline-block">
                <QRCode
                  value={props.pixPayload || ' '}
                  size={200}
                  logoImage="/pix-logo.png"
                  removeQrCodeBehindLogo
                  logoPadding={4}
                  qrStyle="dots"
                  eyeRadius={6}
                  fgColor="#4E784F"
                  bgColor="#FFFFFF"
                />
              </div>
            </div>

            <p className="text-center font-serif text-2xl text-amber mb-2">
              R$ {props.totalAmount.toFixed(2)}
            </p>
            <p className="text-center font-sans text-xs text-mauve mb-6">
              {selectedCotas.map((c) => (lang === 'pt' ? c.label_pt : c.label_en)).join(' + ')}
            </p>

            {/* Copy code */}
            <button
              onClick={props.onCopyPix}
              className="w-full py-2.5 mb-3 rounded-full border border-forest/40 text-forest font-sans text-xs tracking-widest uppercase hover:bg-forest/5 transition-colors"
            >
              {pixCopied ? t('gifts.pixCopied') : t('gifts.pixCopy')}
            </button>

            <button
              onClick={props.onProceedToConfirm}
              className="w-full py-3.5 rounded-full bg-forest text-peach font-sans text-xs tracking-widest uppercase hover:bg-forest/90 transition-colors"
            >
              {t('gifts.proceed')} →
            </button>

            {gift.cotas.length > 1 && (
              <button
                onClick={props.onBack}
                className="w-full mt-2 py-2 text-mauve font-sans text-xs hover:text-forest transition-colors"
              >
                ← {t('gifts.back')}
              </button>
            )}
          </>
        )}

        {/* ── Step: confirm (card + email) ── */}
        {step === 'confirm' && (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="font-sans text-xs tracking-widest uppercase text-mauve block mb-2">
                  {t('gifts.cardMessage')}
                </label>
                <textarea
                  value={cardMessage}
                  onChange={(e) => props.onCardMessageChange(e.target.value)}
                  placeholder={t('gifts.cardPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-sage/40 bg-peach/20 font-sans text-sm text-forest placeholder-mauve/40 focus:outline-none focus:border-forest/50 resize-none transition-colors"
                />
              </div>

              <div>
                <label className="font-sans text-xs tracking-widest uppercase text-mauve block mb-2">
                  {t('gifts.yourEmail')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => props.onEmailChange(e.target.value)}
                  placeholder={t('gifts.emailPlaceholder')}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-sage/40 bg-peach/20 font-sans text-sm text-forest placeholder-mauve/40 focus:outline-none focus:border-forest/50 transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-sm text-amber text-center mb-3 font-sans">{error}</p>}

            <button
              onClick={props.onConfirm}
              disabled={submitting}
              className="w-full py-3.5 rounded-full bg-forest text-peach font-sans text-xs tracking-widest uppercase hover:bg-forest/90 transition-colors disabled:opacity-60"
            >
              {submitting ? t('gifts.confirming') : t('gifts.confirmPurchase')}
            </button>

            <button
              onClick={props.onBack}
              className="w-full mt-2 py-2 text-mauve font-sans text-xs hover:text-forest transition-colors"
            >
              ← {t('gifts.back')}
            </button>
          </>
        )}

        {/* ── Step: success ── */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-5">🌸</div>
            <h4 className="font-serif text-2xl text-forest mb-2">{t('gifts.successTitle')}</h4>
            <p className="font-sans text-sm text-mauve mb-6 leading-relaxed">
              {t('gifts.successText')}
            </p>

            {/* Receipt */}
            <div className="bg-peach/50 rounded-2xl p-4 text-left mb-6">
              <p className="font-sans text-xs tracking-widest uppercase text-mauve mb-2">Resumo</p>
              <p className="font-serif text-lg text-forest">{giftName}</p>
              {selectedCotas.map((c) => (
                <div key={c.cotaId} className="flex justify-between mt-1">
                  <span className="font-sans text-xs text-mauve">
                    {lang === 'pt' ? c.label_pt : c.label_en}
                  </span>
                  <span className="font-sans text-xs font-semibold text-amber">R$ {c.price}</span>
                </div>
              ))}
              <div className="border-t border-sage/30 mt-2 pt-2 flex justify-between">
                <span className="font-sans text-xs text-forest font-semibold">Total</span>
                <span className="font-sans text-sm font-bold text-amber">
                  R$ {props.totalAmount.toFixed(2)}
                </span>
              </div>
              {cardMessage && (
                <p className="mt-3 font-sans text-xs text-mauve italic border-l-2 border-sage pl-3">
                  "{cardMessage}"
                </p>
              )}
            </div>

            <button
              onClick={props.onClose}
              className="w-full py-3.5 rounded-full bg-forest text-peach font-sans text-xs tracking-widest uppercase"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
