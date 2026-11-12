import { describe, expect, it } from 'vitest'
import { CONFIG } from '../content.config'
import { ceremonyStart } from './weddingDate'

describe('ceremonyStart', () => {
  it('counts down to the ceremony, in Brasília', () => {
    expect(ceremonyStart()).toBe(`${CONFIG.wedding.date}T15:30:00-03:00`)
    // 15:30 in Brasília is 18:30 UTC.
    expect(new Date(ceremonyStart()).toISOString()).toBe(`${CONFIG.wedding.date}T18:30:00.000Z`)
  })
})
