import { describe, expect, it } from 'vitest'
import { paypalMeUrl, priceText, revolutUrl, toEur, totalEur } from './euro'
import { CONFIG } from '../content.config'

describe('toEur', () => {
  it('converts at the fixed rate and rounds to whole euros', () => {
    expect(toEur(100)).toBe(Math.round(100 * CONFIG.euro.eurPerBrl))
    expect(Number.isInteger(toEur(137))).toBe(true)
  })

  it('never charges less than one euro', () => {
    expect(toEur(1)).toBe(1)
  })

  it('totals cota by cota, so the sum matches the prices shown', () => {
    const prices = [130, 130, 130]
    expect(totalEur(prices)).toBe(3 * toEur(130))
  })
})

describe('paypalMeUrl', () => {
  it('fills the amount in, in euros', () => {
    expect(paypalMeUrl(80)).toBe(`https://paypal.me/${CONFIG.euro.paypalMe}/80EUR`)
  })
})

describe('revolutUrl', () => {
  it('opens the Revolut.Me page', () => {
    expect(revolutUrl()).toBe(`https://revolut.me/${CONFIG.euro.revolutMe}`)
  })
})

describe('priceText', () => {
  it('shows a catalog price in reais, or in whole euros', () => {
    expect(priceText(250, false)).toBe('R$ 250')
    expect(priceText(250, true)).toBe(`€ ${toEur(250)}`)
  })
})
