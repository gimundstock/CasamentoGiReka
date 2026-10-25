import { useEffect, useRef } from 'react'
import { useMotionValueEvent, type MotionValue } from 'framer-motion'

interface Props {
  src: string
  /** Width / height of the painting. */
  aspect: number
  progress: MotionValue<number>
  /** Sun position along the scroll, in % of the painting box (0–100). */
  sunX: (v: number) => number
  sunY: (v: number) => number
  /** Scroll progress where the paint starts spreading from the sun. */
  start: number
  /** Scroll progress by which the whole painting is colored. */
  end: number
}

// Resolution of the reveal map. It is upscaled smoothly onto the painting,
// so it only needs to carry the shape of the wet edge, not pixel detail.
const GRID_W = 480
// Paint radius around the sun, in painting widths: a small pool when the
// sun settles, growing until it covers the whole painting at `end`.
const RADIUS_FROM = 0.1
const RADIUS_TO = 0.85
// How far the edge bleeds in and out of the circle (painting widths), and
// how soft it is (scroll progress).
const BLEED = 0.07
const FEATHER = 0.025

// Small value-noise + fBm, enough to give the edge a watercolor bloom.
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const w = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w
}

function fbm(x: number, y: number): number {
  let sum = 0
  let amp = 0.5
  let freq = 1
  for (let o = 0; o < 4; o++) {
    sum += amp * valueNoise(x * freq, y * freq)
    freq *= 2.1
    amp *= 0.5
  }
  return sum / 0.9375
}

/**
 * For every cell of the reveal map, the scroll progress at which the paint
 * reaches it: the first moment the sun, travelling its arc, comes within
 * its (growing, noise-bled) radius. Computed once.
 */
function buildRevealMap(
  aspect: number,
  sunX: (v: number) => number,
  sunY: (v: number) => number,
  start: number,
  end: number
) {
  const gw = GRID_W
  const gh = Math.round(GRID_W / aspect)
  const reveal = new Float32Array(gw * gh).fill(Infinity)
  const bleed = new Float32Array(gw * gh)
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      bleed[j * gw + i] = (fbm(i / 38, j / 38) - 0.5) * 2 * BLEED
    }
  }

  const steps = 240
  for (let k = 0; k <= steps; k++) {
    const v = start + (k / steps) * (end - start)
    const t = k / steps
    const r = RADIUS_FROM + (RADIUS_TO - RADIUS_FROM) * Math.pow(t, 1.6)
    // Sun center in grid cells (both axes measured in painting widths).
    const cx = (sunX(v) / 100) * gw
    const cy = (sunY(v) / 100) * gh
    const reach = (r + BLEED) * gw
    const i0 = Math.max(0, Math.floor(cx - reach))
    const i1 = Math.min(gw - 1, Math.ceil(cx + reach))
    const j0 = Math.max(0, Math.floor(cy - reach))
    const j1 = Math.min(gh - 1, Math.ceil(cy + reach))
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const idx = j * gw + i
        if (reveal[idx] !== Infinity) continue
        const d = Math.hypot(i - cx, j - cy) / gw + bleed[idx]
        if (d <= r) reveal[idx] = v
      }
    }
  }
  // Anything the arc never reached is painted at the very end.
  for (let n = 0; n < reveal.length; n++) if (reveal[n] === Infinity) reveal[n] = end
  return { reveal, gw, gh }
}

/**
 * The cerrado watercolor, painted in as the sun travels: the color spreads
 * out from the sun and stays along its arc, the pool widening as the sun
 * goes, with a soft, bleeding watercolor edge. Drawn on a canvas — the
 * painting is masked by a small reveal map, upscaled each frame.
 */
export function CerradoPaint({ src, aspect, progress, sunX, sunY, start, end }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    img: HTMLImageElement | null
    map: ReturnType<typeof buildRevealMap> | null
    mask: HTMLCanvasElement | null
    maskData: ImageData | null
    /** What the canvas shows now, so unchanged frames are skipped. */
    drawn: 'empty' | 'full' | 'partial' | null
    frame: number
  }>({ img: null, map: null, mask: null, maskData: null, drawn: null, frame: 0 })

  /**
   * Repaints only when the picture changes: while the sun hasn't started the
   * paint (or once it's all painted) every frame would otherwise clear or
   * redraw the whole canvas, and re-uploading it each time drops frames.
   */
  function draw(v: number) {
    const canvas = canvasRef.current
    const { img, map, mask, maskData } = stateRef.current
    if (!canvas || !img || !map || !mask || !maskData) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const state = stateRef.current
    const next = v <= start ? 'empty' : v >= end + FEATHER ? 'full' : 'partial'
    if (next !== 'partial' && next === state.drawn) return
    state.drawn = next
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, W, H)
    if (next === 'empty') return
    if (next === 'full') {
      ctx.drawImage(img, 0, 0, W, H)
      return
    }

    const px = maskData.data
    const { reveal } = map
    for (let n = 0; n < reveal.length; n++) {
      const a = (v - reveal[n]) / FEATHER
      px[n * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : a * 255
    }
    mask.getContext('2d')?.putImageData(maskData, 0, 0)
    ctx.imageSmoothingEnabled = true
    // The mask is a soft edge already; 'high' smoothing costs a lot for nothing.
    ctx.imageSmoothingQuality = 'medium'
    ctx.drawImage(mask, 0, 0, W, H)
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(img, 0, 0, W, H)
    ctx.globalCompositeOperation = 'source-over'
  }

  // At most one repaint per frame, with the latest progress.
  useMotionValueEvent(progress, 'change', () => {
    const state = stateRef.current
    if (state.frame) return
    state.frame = requestAnimationFrame(() => {
      state.frame = 0
      draw(progress.get())
    })
  })

  useEffect(() => {
    const state = stateRef.current
    const map = buildRevealMap(aspect, sunX, sunY, start, end)
    const mask = document.createElement('canvas')
    mask.width = map.gw
    mask.height = map.gh
    const maskData = new ImageData(map.gw, map.gh)
    // Mask color is irrelevant (only alpha is used by source-in).
    state.map = map
    state.mask = mask
    state.maskData = maskData

    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      state.img = img
      state.drawn = null
      draw(progress.get())
    }
    img.src = src

    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      // Resizing clears the canvas, so repaint whatever it should show.
      state.drawn = null
      draw(progress.get())
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      img.onload = null
      cancelAnimationFrame(state.frame)
      state.frame = 0
    }
    // draw reads everything from refs; the inputs are module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, aspect, start, end])

  return <canvas ref={canvasRef} className="h-full w-full" />
}
