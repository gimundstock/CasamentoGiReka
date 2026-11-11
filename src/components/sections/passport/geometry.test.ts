import { describe, expect, it } from 'vitest'
import { CHAPTER, DESK, passportTime, passportVh, PASSPORT_VH, PHASE, snapTarget } from './geometry'

const HOLD = DESK.hold[1] - DESK.hold[0]
const shut = PHASE.open[0] - 10
const openMid = (desk: boolean) => (PHASE.open[1] + (desk ? DESK.close[0] : PASSPORT_VH)) / 2
/** The stage's scroll (at) for a moment of the passport's own time. */
const at = (v: number, desk: boolean) => (desk ? v + HOLD : v)

describe.each([false, true])('snapTarget (desk: %s)', (desk) => {
  const open = at(openMid(desk), desk)

  it('leaves the scroll alone before the passport and while it lies open', () => {
    expect(snapTarget(at(200, desk), 1, desk)).toBeNull()
    expect(snapTarget(at(shut, desk), 1, desk)).toBeNull()
    expect(snapTarget(open, 1, desk)).toBeNull()
    expect(snapTarget(open, -1, desk)).toBeNull()
  })

  it('finishes opening once the guest has scrolled a little way into it', () => {
    expect(snapTarget(at(PHASE.open[0] + 30, desk), 1, desk)).toBe(open)
    // Barely started: back to the shut cover.
    expect(snapTarget(at(shut + 5, desk), 1, desk)).toBe(at(shut, desk))
  })

  it('scrolling back up, closes it unless it was nearly open', () => {
    expect(snapTarget(at(PHASE.open[0] + 30, desk), -1, desk)).toBe(at(shut, desk))
    expect(snapTarget(at(PHASE.open[1] + 5, desk), -1, desk)).toBe(open)
  })

  it('centres a book left at the very end of its readable stretch', () => {
    const end = desk ? DESK.close[0] : PASSPORT_VH
    expect(snapTarget(at(end - 3, desk), -1, desk)).toBe(open)
  })

  it('always lands where the book lies fully open', () => {
    const v = passportTime(open, desk)
    expect(v).toBeGreaterThanOrEqual(PHASE.open[1])
    expect(v).toBeLessThan(desk ? DESK.close[0] : PASSPORT_VH)
  })
})

describe('snapTarget on the desk', () => {
  it('a book left closing goes back open, or on to shut — never to the envelope', () => {
    const open = openMid(true) + HOLD
    const shutAgain = DESK.close[1] + HOLD
    expect(snapTarget(DESK.close[0] + 20 + HOLD, -1, true)).toBe(open)
    expect(snapTarget(DESK.close[0] + 20 + HOLD, 1, true)).toBe(shutAgain)
    expect(snapTarget(shutAgain, 1, true)).toBeNull()
  })

  it('a push left part-way goes on to the envelope, or back to the shut book', () => {
    expect(snapTarget(DESK.arrive[0] + 20 + HOLD, 1, true)).toBe(DESK.end + HOLD)
    expect(snapTarget(DESK.arrive[0] + 20 + HOLD, -1, true)).toBe(DESK.close[1] + HOLD)
  })

  it('ignores the hold, where the passport lies on the desk', () => {
    expect(snapTarget(DESK.hold[0] + 20, 1, true)).toBeNull()
  })
})

describe('snapTarget with the padrinhos’ manual', () => {
  const c = (n: number) => CHAPTER.at + n + HOLD
  it('carries a manual part-way in on to it lying shut, or back to the passport', () => {
    expect(snapTarget(c(30), 1, true, 'desk')).toBe(c(CHAPTER.shut))
    expect(snapTarget(c(30), -1, true, 'desk')).toBe(DESK.close[1] + HOLD)
  })
  it('finishes unfolding it, and leaves it alone lying open', () => {
    const open = c((CHAPTER.unfold[1] + CHAPTER.fold[0]) / 2)
    expect(snapTarget(c(CHAPTER.unfold[0] + 20), 1, true, 'desk')).toBe(open)
    expect(snapTarget(open, 1, true, 'desk')).toBeNull()
  })
  it('the envelope comes only after it, the stage that much longer', () => {
    expect(snapTarget(c(CHAPTER.len) + 20, 1, true, 'desk')).toBe(DESK.end + HOLD + CHAPTER.len)
    expect(passportVh(true, 'desk')).toBe(passportVh(true) + CHAPTER.len)
  })
  it('on a phone, stops at each panel', () => {
    const middle = c((CHAPTER.toMiddle[1] + CHAPTER.toRight[0]) / 2)
    expect(snapTarget(c(CHAPTER.toMiddle[0] + 20), 1, true, 'hand')).toBe(middle)
  })
})
