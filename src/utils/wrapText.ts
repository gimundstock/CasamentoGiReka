/**
 * Breaks `text` into lines no wider than `maxWidth` (`measure` gives a
 * string's width), as the card's CSS does (`white-space: pre-line`,
 * `overflow-wrap: anywhere`): line breaks are kept, runs of spaces are
 * one, and a word wider than a whole line is cut where it no longer fits.
 */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (measure(next) <= maxWidth) {
        line = next
        continue
      }
      if (line) lines.push(line)
      line = ''
      let rest = Array.from(word)
      while (measure(rest.join('')) > maxWidth && rest.length > 1) {
        let n = 1
        while (n < rest.length - 1 && measure(rest.slice(0, n + 1).join('')) <= maxWidth) n++
        lines.push(rest.slice(0, n).join(''))
        rest = rest.slice(n)
      }
      line = rest.join('')
    }
    if (line) lines.push(line)
  }
  return lines
}
