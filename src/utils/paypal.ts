import { CONFIG } from '../content.config'

/** What PayPal charges for a BRL catalog price: the fixed rate, whole euros, at least €1. */
export function toEur(brl: number): number {
  return Math.max(1, Math.round(brl * CONFIG.paypal.eurPerBrl))
}

/** A cota-by-cota sum, so the total always equals the euro prices the guest saw. */
export function totalEur(prices: number[]): number {
  return prices.reduce((sum, p) => sum + toEur(p), 0)
}

export function paypalEnabled(): boolean {
  return CONFIG.paypal.clientId !== ''
}

// The slice of the PayPal JS SDK the checkout uses.
export interface PaypalButtons {
  render: (el: HTMLElement) => Promise<void>
  close: () => Promise<void>
}
export interface PaypalNamespace {
  Buttons: (opts: {
    style?: Record<string, string | number>
    createOrder: (
      data: unknown,
      actions: { order: { create: (order: unknown) => Promise<string> } }
    ) => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onCancel?: () => void
    onError?: (err: unknown) => void
  }) => PaypalButtons
}

declare global {
  interface Window {
    paypal?: PaypalNamespace
  }
}

let sdk: Promise<PaypalNamespace> | null = null

/** Loads the PayPal JS SDK once, in the site's currency, on first use. */
export function loadPaypalSdk(): Promise<PaypalNamespace> {
  if (sdk) return sdk
  sdk = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      'client-id': CONFIG.paypal.clientId,
      currency: CONFIG.paypal.currency,
      intent: 'capture',
      components: 'buttons',
      'disable-funding': 'paylater',
    })
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?${params}`
    script.async = true
    script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('no paypal')))
    script.onerror = () => {
      sdk = null
      script.remove()
      reject(new Error('PayPal SDK failed to load'))
    }
    document.head.appendChild(script)
  })
  return sdk
}
