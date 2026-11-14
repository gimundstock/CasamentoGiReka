import { describe, expect, it } from 'vitest'
import { MAX_CARD_LINE_BREAKS, limitLineBreaks } from './cardThemes'

describe('limitLineBreaks', () => {
  it('leaves a message with few line breaks as typed', () => {
    expect(limitLineBreaks('Oi\n\nTudo bem?\nBeijos')).toBe('Oi\n\nTudo bem?\nBeijos')
  })

  it('keeps the first line breaks and makes the rest spaces', () => {
    const typed = Array.from({ length: 15 }, (_, i) => `l${i}`).join('\n')
    const kept = limitLineBreaks(typed)
    expect(kept.split('\n')).toHaveLength(MAX_CARD_LINE_BREAKS + 1)
    expect(kept.endsWith('l10 l11 l12 l13 l14')).toBe(true)
    expect(kept.replace(/\s/g, '')).toBe(typed.replace(/\s/g, ''))
  })
})
