import { describe, expect, it } from 'vitest'
import { groupCotas, setGroupQuantity, summarizeCotas } from './cotas'
import type { Cota } from '../types'

const cota = (id: string, label: string, price: number, purchased = false): Cota => ({
  cotaId: id,
  giftId: 'g',
  label_pt: label,
  label_en: label,
  price,
  purchased,
})

const cotas = [
  cota('a', 'Hotel', 800),
  cota('b', 'Hotel', 800, true),
  cota('c', 'Hotel', 800),
  cota('d', 'Voo', 700),
]

describe('cotas', () => {
  it('groups cotas by label and price, keeping catalog order', () => {
    const groups = groupCotas(cotas)
    expect(groups.map((g) => [g.label_pt, g.cotas.length])).toEqual([
      ['Hotel', 3],
      ['Voo', 1],
    ])
  })

  it('selects the first unsold cotas of a group and leaves other groups alone', () => {
    const [hotel] = groupCotas(cotas)
    const picked = setGroupQuantity([cotas[3]], hotel, 2)
    expect(picked.map((c) => c.cotaId)).toEqual(['d', 'a', 'c'])
    expect(setGroupQuantity(picked, hotel, 0).map((c) => c.cotaId)).toEqual(['d'])
  })

  it('summarizes repeated cotas with a multiplier', () => {
    expect(summarizeCotas([cotas[0], cotas[2], cotas[3]], 'pt')).toBe('2× Hotel + Voo')
  })
})
