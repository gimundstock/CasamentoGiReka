import { describe, expect, it } from 'vitest'
import { toEur, totalEur } from './paypal'
import { CONFIG } from '../content.config'

describe('toEur', () => {
  it('converts at the fixed rate and rounds to whole euros', () => {
    expect(toEur(100)).toBe(Math.round(100 * CONFIG.paypal.eurPerBrl))
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
