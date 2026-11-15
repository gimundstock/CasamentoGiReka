import { CONFIG } from '../content.config'

/** A cota's euro price: its BRL price at the fixed rate, in whole euros, at least €1. */
export function toEur(brl: number): number {
  return Math.max(1, Math.round(brl * CONFIG.euro.eurPerBrl))
}

/** A cota-by-cota sum, so the total always equals the euro prices the guest saw. */
export function totalEur(prices: number[]): number {
  return prices.reduce((sum, p) => sum + toEur(p), 0)
}

/** PayPal is offered once the PayPal.Me username is set (VITE_PAYPAL_ME). */
export function paypalMeEnabled(): boolean {
  return CONFIG.euro.paypalMe.trim() !== ''
}

/** Revolut is offered once the Revolut.Me username is set (VITE_REVOLUT_ME). */
export function revolutEnabled(): boolean {
  return CONFIG.euro.revolutMe.trim() !== ''
}

export function euroEnabled(): boolean {
  return paypalMeEnabled() || revolutEnabled()
}

/**
 * Prices in euros, and paying in euros first: for whoever reads the site in
 * English (a price in reais means little to them), once a euro way is set up.
 * In Portuguese, reais and PIX.
 */
export function euroFirst(lang: string): boolean {
  return lang === 'en' && euroEnabled()
}

/** A BRL catalog price as shown: in reais, or (euro first) in whole euros. */
export function priceText(brl: number, inEuros: boolean): string {
  return inEuros ? `€ ${toEur(brl)}` : `R$ ${brl}`
}

/** The PayPal.Me link with the amount filled in: paypal.me/<user>/<amount>EUR. */
export function paypalMeUrl(amountEur: number): string {
  return `https://paypal.me/${encodeURIComponent(CONFIG.euro.paypalMe.trim())}/${amountEur}EUR`
}

/** The Revolut.Me page (the guest types the amount there). */
export function revolutUrl(): string {
  return `https://revolut.me/${encodeURIComponent(CONFIG.euro.revolutMe.trim())}`
}
