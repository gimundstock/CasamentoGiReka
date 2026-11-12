import { describe, expect, it } from 'vitest'
import { CONFIG } from '../content.config'
import { ceremonyStart, weddingDay } from './weddingDate'

describe('weddingDate', () => {
  it('prints the wedding day as configured, whatever the time zone', () => {
    const [y, m, d] = CONFIG.wedding.date.split('-').map(Number)
    const day = weddingDay()
    expect([day.getFullYear(), day.getMonth() + 1, day.getDate()]).toEqual([y, m, d])
  })

  it('counts down to the ceremony, in Brasília', () => {
    expect(ceremonyStart()).toBe(`${CONFIG.wedding.date}T15:30:00-03:00`)
    // 15:30 in Brasília is 18:30 UTC.
    expect(new Date(ceremonyStart()).toISOString()).toBe(`${CONFIG.wedding.date}T18:30:00.000Z`)
  })
})
