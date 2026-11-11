import { useImperativeHandle, useRef, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollHint } from '../../ui/ScrollHint'
import { NAV_HEIGHT } from '../Envelope'
import { CHAPTER, DESK, ease, pushedAt, seg, type PassportGeometry } from '../passport/geometry'
import { Gatefold, type GatefoldHandle } from './Gatefold'
import type { ManualOnDesk } from './geometry'

export interface DeskChapterHandle {
  /**
   * At `c` (vh into the chapter, see manualTime) and the passport's own
   * time `v`, which runs on again after it (the envelope's push).
   */
  update(c: number, v: number): void
}

/**
 * The padrinhos' manual on the desk (CHAPTER): drawn in from the right
 * once the passport has shut again, pushing it off; it unfolds left and
 * right with the scroll, lies open (on a phone, looked along a panel at a
 * time), folds shut, and the envelope pushes it off as it pushed the
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
  const foldRef = useRef<GatefoldHandle>(null)
  const { w, h, y, pan } = spot
  const hintTop = h + 18

  useImperativeHandle(handle, () => ({
    update(c: number, v: number) {
      const mover = moverRef.current
      if (!mover) return
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
      // A phone: the left panel comes on as it unfolds, then the middle,
      // the right, and back to the middle as it folds.
      if (panRef.current && pan) {
        const at = opened - ease(seg(c, CHAPTER.toMiddle)) - ease(seg(c, CHAPTER.toRight)) + folded
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
      <div
        ref={kickerRef}
        aria-hidden
        className="font-sans text-amber-deep absolute inset-x-0 text-center text-[0.65rem] tracking-[0.4em] uppercase"
        style={{ top: NAV_HEIGHT + 32, opacity: 0, visibility: 'hidden' }}
      >
        {t('padrinhos.kicker')}
      </div>
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
          <Gatefold w={w} h={h} handle={foldRef} />
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
