import { describe, expect, it } from 'vitest'
import { wrapText } from './wrapText'

// Every character is 10 wide.
const measure = (s: string) => s.length * 10

describe('wrapText', () => {
  it('breaks at spaces, within the width', () => {
    expect(wrapText('um dois tres quatro', 90, measure)).toEqual(['um dois', 'tres', 'quatro'])
  })

  it('keeps the line breaks that were typed, and collapses runs of spaces', () => {
    expect(wrapText('oi   tudo\n\nbem', 200, measure)).toEqual(['oi tudo', '', 'bem'])
  })

  it('cuts a word wider than the line, wherever it falls', () => {
    expect(wrapText('a'.repeat(25), 100, measure)).toEqual([
      'a'.repeat(10),
      'a'.repeat(10),
      'aaaaa',
    ])
  })

  it('a long word starts on its own line, the one before it ends', () => {
    expect(wrapText('oi ' + 'b'.repeat(15), 100, measure)).toEqual(['oi', 'b'.repeat(10), 'bbbbb'])
  })

  it('never loops on a width smaller than one character', () => {
    expect(wrapText('abc', 5, measure)).toEqual(['a', 'b', 'c'])
  })
})
