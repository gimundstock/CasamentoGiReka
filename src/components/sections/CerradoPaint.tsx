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

/** Cells the mask is softened over, each way (two box passes ≈ a gentle blur). */
const SOFTEN = 2

/** One horizontal box blur of `src` into `dst` (a sliding-window average). */
function boxRows(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const span = 2 * r + 1
  for (let j = 0; j < h; j++) {
    const row = j * w
    let sum = 0
    for (let i = -r; i <= r; i++) sum += src[row + Math.min(w - 1, Math.max(0, i))]
    for (let i = 0; i < w; i++) {
      dst[row + i] = sum / span
      sum += src[row + Math.min(w - 1, i + r + 1)] - src[row + Math.max(0, i - r)]
    }
  }
}

/** The same down the columns. */
function boxCols(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const span = 2 * r + 1
  for (let i = 0; i < w; i++) {
    let sum = 0
    for (let j = -r; j <= r; j++) sum += src[Math.min(h - 1, Math.max(0, j)) * w + i]
    for (let j = 0; j < h; j++) {
      dst[j * w + i] = sum / span
      sum += src[Math.min(h - 1, j + r + 1) * w + i] - src[Math.max(0, j - r) * w + i]
    }
  }
}

/** Softens the mask in place: two box blurs each way, about a 2-cell blur. */
function softenMask(alpha: Float32Array, scratch: Float32Array, w: number, h: number) {
  for (let pass = 0; pass < 2; pass++) {
    boxRows(alpha, scratch, w, h, SOFTEN)
    boxCols(scratch, alpha, w, h, SOFTEN)
  }
}

/** The stage's paper (bg-peach), which the unpainted part of the painting shows. */
const PAPER = [0xfb, 0xfa, 0xf8] as const
/**
 * The paper layer's resolution, as a share of the painting's size on screen
 * (at up to 1.5 device pixels per CSS pixel). The reveal map is enlarged
 * into it smoothly (high-quality resampling); the browser then stretches it
 * the rest of the way. Stretched by the browser alone from the map's own
 * cells, Safari showed the cells as steps along the wet edge.
 */
const COVER_RES = 0.5

/**
 * A repaint of the paper that takes longer than this (ms) is a slow device's
 * (an M-series laptop: ~1.5; a ten-year-old one or an old phone: 5 and up).
 * After SLOW_RUN of them in a row the paper is repainted every other frame
 * from then on: the wet edge follows the sun a frame late, which doesn't
 * show, and the frames in between are left for everything else on screen.
 */
const SLOW_MS = 4
const SLOW_RUN = 6

/**
 * The cerrado watercolor, painted in as the sun travels: the color spreads
 * out from the sun and stays along its arc, the pool widening as the sun
 * goes, with a soft, bleeding watercolor edge.
 *
 * The painting is a plain image, drawn once; over it lies a canvas of the
 * stage's own paper at half the painting's resolution (COVER_RES),
 * transparent where the paint has come in — the reveal map, enlarged
 * smoothly into it. Over a plain paper background that is exactly the
 * masked painting; each frame only that one smaller layer is redrawn. (The
 * painting itself used to be re-masked on a full-size canvas every frame,
 * two full-size draws: ~100 ms a frame on a computer drawing without its
 * graphics card, as old ones do.)
 */
export function CerradoPaint({ src, aspect, progress, sunX, sunY, start, end }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    map: ReturnType<typeof buildRevealMap> | null
    /** The reveal map as paper (one pixel per cell), and its pixels. */
    grid: HTMLCanvasElement | null
    cover: ImageData | null
    /** What the canvas shows now, so unchanged frames are skipped. */
    drawn: 'empty' | 'full' | 'partial' | null
    frame: number
    /** Per-cell paint amount (0–1) and a scratch buffer for softening it. */
    alpha: Float32Array | null
    scratch: Float32Array | null
    /** Slow repaints in a row; `slow` once there were SLOW_RUN (see SLOW_MS). */
    slowRun: number
    slow: boolean
    /** The last frame was passed over (a slow device repaints every other). */
    skipped: boolean
  }>({
    map: null,
    grid: null,
    cover: null,
    drawn: null,
    frame: 0,
    alpha: null,
    scratch: null,
    slowRun: 0,
    slow: false,
    skipped: false,
  })

  /** Repaints the paper only when the picture changes. */
  function draw(v: number) {
    const canvas = canvasRef.current
    const state = stateRef.current
    const { map, grid, cover } = state
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !map || !grid || !cover) return
    const next = v <= start ? 'empty' : v >= end + FEATHER ? 'full' : 'partial'
    if (next !== 'partial' && next === state.drawn) return
    state.drawn = next
    // All painted: the paper is gone (and out of the page's layers).
    canvas.style.visibility = next === 'full' ? 'hidden' : ''
    if (next === 'full') return

    const W = canvas.width
    const H = canvas.height
    if (next === 'empty') {
      ctx.fillStyle = `rgb(${PAPER.join(',')})`
      ctx.fillRect(0, 0, W, H)
      return
    }
    const began = performance.now()
    const px = cover.data
    const { reveal, gw, gh } = map
    const alpha = state.alpha!
    for (let n = 0; n < reveal.length; n++) {
      const a = (v - reveal[n]) / FEATHER
      alpha[n] = a <= 0 ? 0 : a >= 1 ? 1 : a
    }
    // Where the paint stops along the sides of the sun's path the map has
    // a hard edge, one cell painted and the next not; stretched, those
    // cells would show as steps, worst on narrow screens where the
    // painting is much wider than the window. Softened over a few cells
    // first, the edge is a smooth watercolor one at any size.
    softenMask(alpha, state.scratch!, gw, gh)
    for (let n = 0; n < alpha.length; n++) px[n * 4 + 3] = (1 - alpha[n]) * 255
    grid.getContext('2d')?.putImageData(cover, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(grid, 0, 0, W, H)
    if (!state.slow) {
      state.slowRun = performance.now() - began > SLOW_MS ? state.slowRun + 1 : 0
      if (state.slowRun >= SLOW_RUN) state.slow = true
    }
  }

  // At most one repaint per frame, with the latest progress — every other
  // frame on a slow device (the one passed over repaints on the next, so
  // the last progress is always drawn).
  useMotionValueEvent(progress, 'change', () => {
    const state = stateRef.current
    if (state.frame) return
    const paint = () => {
      if (state.slow && !state.skipped) {
        state.skipped = true
        state.frame = requestAnimationFrame(paint)
        return
      }
      state.skipped = false
      state.frame = 0
      draw(progress.get())
    }
    state.frame = requestAnimationFrame(paint)
  })

  useEffect(() => {
    const state = stateRef.current
    const map = buildRevealMap(aspect, sunX, sunY, start, end)
    const grid = document.createElement('canvas')
    grid.width = map.gw
    grid.height = map.gh
    const cover = new ImageData(map.gw, map.gh)
    for (let n = 0; n < cover.data.length; n += 4) {
      cover.data[n] = PAPER[0]
      cover.data[n + 1] = PAPER[1]
      cover.data[n + 2] = PAPER[2]
    }
    state.map = map
    state.grid = grid
    state.cover = cover
    state.alpha = new Float32Array(map.gw * map.gh)
    state.scratch = new Float32Array(map.gw * map.gh)
    state.drawn = null

    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * COVER_RES
      canvas.width = Math.max(map.gw, Math.round(rect.width * scale))
      canvas.height = Math.max(map.gh, Math.round(rect.height * scale))
      // Resizing clears the canvas, so repaint whatever it should show.
      state.drawn = null
      draw(progress.get())
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(state.frame)
      state.frame = 0
    }
    // draw reads everything from refs; the inputs are module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, start, end])

  return (
    <>
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full max-w-none select-none"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </>
  )
}
