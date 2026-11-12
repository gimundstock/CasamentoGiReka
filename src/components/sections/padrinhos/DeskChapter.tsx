import { useImperativeHandle, useRef, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollHint } from '../../ui/ScrollHint'
import { NAV_HEIGHT } from '../Envelope'
import { CHAPTER, DESK, ease, pushedAt, seg, type PassportGeometry } from '../passport/geometry'
import { ManualCard, type ManualCardHandle } from './ManualCard'
import type { ManualOnDesk } from './geometry'

export interface DeskChapterHandle {
  /**
   * At `c` (vh into the chapter, see manualTime), the passport's own time
   * `v`, which runs on again after it (the envelope's push), and the
   * stage's `at` (the desk, before it).
   */
  update(c: number, v: number, at: number): void
}

/**
 * The padrinhos' manual on the desk: lying shut behind the envelope, and
 * carried off to the right with the envelope as the passport is picked
 * up. Then its chapter (CHAPTER): drawn back in from the right once the
 * passport has shut again, pushing it off, to the passport's own place;
 * it opens as the passport does, lies open (on a phone, looked at a page
 * at a time), shuts, and the envelope pushes it off as it pushed the
 * passport. With a kicker above it, and a hint under it.
 */
export function DeskChapter({
  g,
  spot,
  handle,
}: {
  g: PassportGeometry
  spot: ManualOnDesk
  handle: Ref<DeskChapterHandle>
}) {
  const { t } = useTranslation()
  const moverRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const kickerRef = useRef<HTMLDivElement>(null)
  const openHintRef = useRef<HTMLDivElement>(null)
  const onHintRef = useRef<HTMLDivElement>(null)
  const foldRef = useRef<ManualCardHandle>(null)
  const { w, h, y, pan } = spot
  const hintTop = h + 18

  useImperativeHandle(handle, () => ({
    update(c: number, v: number, at: number) {
      const mover = moverRef.current
      if (!mover) return
      if (c <= 0) {
        // Lying on the desk: laid down just after the envelope, and carried
        // off to the right with it as the passport is picked up.
        const L = spot.lying
        const away = ease(seg(at, DESK.pickUp))
        const laid = ease(seg(at, [DESK.layIn[0] + 20, DESK.layIn[1] + 15]))
        mover.style.visibility = laid > 0 && away < 1 ? 'inherit' : 'hidden'
        mover.style.opacity = String(laid)
        // The last of the three: over the envelope's end, (on a phone, the
        // fan's last card) under it.
        mover.style.zIndex = spot.lying.over ? '1' : '0'
        const x = L.x - g.vw / 2 + (spot.offRight + g.vw / 2 - L.x) * away
        const dy = L.y - y + (1 - laid) * 14
        mover.style.transform = `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${(L.rot + 8 * away).toFixed(3)}deg) scale(${L.s.toFixed(5)})`
        foldRef.current?.set(0)
        if (panRef.current) panRef.current.style.transform = 'none'
        for (const el of [kickerRef.current, openHintRef.current, onHintRef.current]) {
          if (el) el.style.visibility = 'hidden'
        }
        return
      }
      mover.style.opacity = '1'
      const after = c >= CHAPTER.len
      // Pushed off by the envelope, after the chapter (as the passport was).
      const push = after ? seg(v, DESK.arrive) : 0
      const gone = after && seg(v, DESK.shove) >= 1
      mover.style.visibility = c > 0 && !gone ? 'inherit' : 'hidden'
      // Over the passport it pushes; under the envelope that pushes it.
      mover.style.zIndex = after ? '1' : '3'
      let x: number, dy: number, rot: number
      if (push > 0) {
        x = pushedAt(spot.pushed, seg(v, DESK.shove))
        const away = Math.min(1, -x / (g.vw / 2))
        dy = g.vh * 0.03 * away
        rot = -9 * away
      } else {
        // Drawn in as the envelope is, turning straight as it comes.
        const drawn = ease(seg(c, CHAPTER.arrive))
        x = spot.from * (1 - drawn)
        dy = 0
        rot = 5 * (1 - drawn)
      }
      mover.style.transform = `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`

      const opened = ease(seg(c, CHAPTER.unfold))
      const folded = ease(seg(c, CHAPTER.fold))
      foldRef.current?.set(opened * (1 - folded))
      // A phone: the left page comes on as it opens, then the right, and
      // back to the middle as it shuts.
      if (panRef.current && pan) {
        const at = opened - 2 * ease(seg(c, CHAPTER.toRight)) + folded
        panRef.current.style.transform = `translate3d(${(pan * at).toFixed(2)}px, 0, 0)`
      }

      const fade = (el: HTMLElement | null, o: number) => {
        if (!el) return
        el.style.opacity = String(o)
        el.style.visibility = o > 0 ? 'inherit' : 'hidden'
      }
      // The kicker goes as the envelope comes, with its own.
      const kickerOut = after ? seg(v, [DESK.arrive[0], DESK.arrive[0] + 15]) : 0
      fade(kickerRef.current, ease(seg(c, [24, CHAPTER.arrive[1]])) * (1 - kickerOut))
      const [u0, u1] = CHAPTER.unfold
      fade(openHintRef.current, ease(seg(c, [44, 58])) * (1 - seg(c, [u0, u0 + 12])))
      fade(
        onHintRef.current,
        seg(c, [u1 - 12, u1]) * (1 - seg(c, [CHAPTER.fold[0], CHAPTER.fold[0] + 12]))
      )
    },
  }))

  return (
    <>
      {/* (Where there is room for it above the manual: a phone.) */}
      {y - h / 2 - NAV_HEIGHT >= 56 && (
        <div
          ref={kickerRef}
          aria-hidden
          className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
          style={{ top: NAV_HEIGHT + 32, opacity: 0, visibility: 'hidden' }}
        >
          {t('padrinhos.kicker')}
        </div>
      )}
      <div
        ref={moverRef}
        role="region"
        aria-label={t('padrinhos.label')}
        className="absolute"
        style={{
          left: g.vw / 2 - w,
          top: y - h / 2,
          width: 2 * w,
          height: h,
          transformOrigin: 'center',
          visibility: 'hidden',
        }}
      >
        <div ref={panRef}>
          <ManualCard w={w} h={h} radius={spot.radius} handle={foldRef} />
        </div>
        {g.vh - (y + h / 2) >= 40 && (
          <>
            <div
              ref={openHintRef}
              aria-hidden
              className="absolute inset-x-0 text-center"
              style={{ top: hintTop, opacity: 0, visibility: 'hidden' }}
            >
              <ScrollHint label={t('padrinhos.hintOpen')} />
            </div>
            <div
              ref={onHintRef}
              aria-hidden
              className="absolute inset-x-0 text-center"
              style={{ top: hintTop, opacity: 0, visibility: 'hidden' }}
            >
              <ScrollHint label={t('city.passport.hintScroll')} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
