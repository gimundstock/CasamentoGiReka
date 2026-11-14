import {
  CARD_ASPECT,
  MESSAGE_LINE_HEIGHT,
  MIN_MESSAGE_CQW,
  SHRINK_STEP,
  SIGNATURE_CQW,
  SIGNATURE_GAP_CQW,
  SIGNATURE_LINE_HEIGHT,
  estimateMessageSize,
  type CardTheme,
} from '../components/gifts/cardThemes'
import { wrapText } from './wrapText'

/**
 * The card as the picture the guest made — the template they chose with their
 * message and name written on it, laid out as MessageCard shows it — as a
 * base64 JPEG (no `data:` prefix), for the mails and the archive.
 */
export async function renderCardImage(
  theme: CardTheme,
  message: string,
  from: string,
  width = 1484
): Promise<string> {
  const height = Math.round(width / CARD_ASPECT)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')

  const img = await loadImage(theme.image)
  ctx.drawImage(img, 0, 0, width, height)

  // The writing area, as MessageCard places it (% of the card).
  const { top, height: h, left = 15, width: w = 70 } = theme.area
  const areaX = (width * left) / 100
  const areaY = (height * top) / 100
  const areaW = (width * w) / 100
  const areaH = (height * h) / 100
  const cqw = width / 100

  const sigSize = SIGNATURE_CQW * cqw
  const fonts = fontFamilies()
  const sigFont = `${sigSize}px ${fonts.display}`
  await Promise.all([
    document.fonts.load(`${cqw * 2}px ${fonts.serif}`, message),
    document.fonts.load(sigFont, from),
  ])

  const lineWidth = (font: string) => (s: string) => {
    ctx.font = font
    return ctx.measureText(s).width
  }
  const sigLines = from ? wrapText(from, areaW, lineWidth(sigFont)) : []
  const sigGap = sigLines.length ? SIGNATURE_GAP_CQW * cqw : 0
  const sigH = sigLines.length * sigSize * SIGNATURE_LINE_HEIGHT

  // As the card on the page: from the estimate, smaller until it fits the area.
  let sizeCqw = estimateMessageSize(message, !!from, w, (h / 100) * (100 / CARD_ASPECT))
  let msgSize = sizeCqw * cqw
  let msgFont = `${msgSize}px ${fonts.serif}`
  let lines = wrapText(message, areaW, lineWidth(msgFont))
  let msgH = lines.length * msgSize * MESSAGE_LINE_HEIGHT
  while (msgH + sigGap + sigH > areaH && sizeCqw > MIN_MESSAGE_CQW) {
    sizeCqw = Math.max(MIN_MESSAGE_CQW, sizeCqw * SHRINK_STEP)
    msgSize = sizeCqw * cqw
    msgFont = `${msgSize}px ${fonts.serif}`
    lines = wrapText(message, areaW, lineWidth(msgFont))
    msgH = lines.length * msgSize * MESSAGE_LINE_HEIGHT
  }

  ctx.save()
  // (Like the card on the page, nothing is drawn outside its writing area.)
  ctx.beginPath()
  ctx.rect(areaX, areaY, areaW, areaH)
  ctx.clip()
  ctx.fillStyle = theme.ink
  ctx.textBaseline = 'alphabetic'

  // Each line placed as CSS places it in its line box: the font's ascent and
  // descent centred in the line height, the baseline below the ascent. (A
  // 'middle' baseline puts a script with tall ascenders, like the name's,
  // higher than the page does.)
  const baseline = (font: string, size: number, lineHeight: number) => {
    ctx.font = font
    const m = ctx.measureText('Hg')
    const ascent = m.fontBoundingBoxAscent ?? size * 0.8
    const descent = m.fontBoundingBoxDescent ?? size * 0.2
    return (size * lineHeight - (ascent + descent)) / 2 + ascent
  }

  // Centred in the area, the message centred and the name at its lower right.
  let y = areaY + (areaH - msgH - sigGap - sigH) / 2
  const msgLine = msgSize * MESSAGE_LINE_HEIGHT
  const msgBase = baseline(msgFont, msgSize, MESSAGE_LINE_HEIGHT)
  ctx.font = msgFont
  ctx.textAlign = 'center'
  lines.forEach((line, i) => {
    ctx.fillText(line, areaX + areaW / 2, y + i * msgLine + msgBase)
  })
  y += msgH + sigGap
  const sigLine = sigSize * SIGNATURE_LINE_HEIGHT
  const sigBase = baseline(sigFont, sigSize, SIGNATURE_LINE_HEIGHT)
  ctx.font = sigFont
  ctx.textAlign = 'right'
  sigLines.forEach((line, i) => {
    ctx.fillText(line, areaX + areaW, y + i * sigLine + sigBase)
  })
  ctx.restore()

  return canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${src}`))
    img.src = src
  })
}

/** The font stacks the page's `font-serif` and `font-display` classes resolve to. */
function fontFamilies(): { serif: string; display: string } {
  const of = (cls: string) => {
    const el = document.createElement('span')
    el.className = cls
    el.style.cssText = 'position:absolute;visibility:hidden'
    document.body.appendChild(el)
    const family = getComputedStyle(el).fontFamily
    el.remove()
    return family
  }
  return { serif: of('font-serif'), display: of('font-display') }
}
