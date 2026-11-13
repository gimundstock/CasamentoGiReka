import type { Cota } from '../types'

export interface CotaGroup {
  key: string
  label_pt: string
  label_en: string
  price: number
  /** Every cota of this kind, sold or not, in catalog order. */
  cotas: Cota[]
}

/** Cotas with the same label and price are interchangeable: one row with a quantity. */
export function groupCotas(cotas: Cota[]): CotaGroup[] {
  const groups = new Map<string, CotaGroup>()
  for (const cota of cotas) {
    const key = `${cota.label_pt}|${cota.price}`
    const group = groups.get(key)
    if (group) group.cotas.push(cota)
    else
      groups.set(key, {
        key,
        label_pt: cota.label_pt,
        label_en: cota.label_en,
        price: cota.price,
        cotas: [cota],
      })
  }
  return [...groups.values()]
}

/** `selected` with this group's share replaced by its first `qty` unsold cotas. */
export function setGroupQuantity(selected: Cota[], group: CotaGroup, qty: number): Cota[] {
  const ids = new Set(group.cotas.map((c) => c.cotaId))
  const free = group.cotas.filter((c) => !c.purchased)
  return [...selected.filter((c) => !ids.has(c.cotaId)), ...free.slice(0, Math.max(0, qty))]
}

/** "2× Cota da Viagem + Passagens", for one-line summaries of a selection. */
export function summarizeCotas(selected: Cota[], lang: 'pt' | 'en'): string {
  return groupCotas(selected)
    .map((g) => {
      const label = lang === 'pt' ? g.label_pt : g.label_en
      return g.cotas.length > 1 ? `${g.cotas.length}× ${label}` : label
    })
    .join(' + ')
}
