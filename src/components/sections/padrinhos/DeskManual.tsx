import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { CoverFace } from './ManualFaces'
import type { ManualSpot } from './geometry'

/** The shut card's shadow on the desk, as the envelope's. */
const SHADOW = '0 18px 30px -16px rgba(70, 50, 20, 0.45), 0 3px 6px -3px rgba(70, 50, 20, 0.3)'
const LIFTED = '0 26px 40px -18px rgba(70, 50, 20, 0.5), 0 4px 8px -4px rgba(70, 50, 20, 0.3)'

/**
 * The manual lying shut on the desk, with a hand-written note beside it.
 * The whole of it is the button that opens it. Placed and moved by the
 * passport's scroll (BrasiliaPassport sets its transform, opacity,
 * visibility and pointer-events through `divRef`).
 */
export function DeskManual({
  spot,
  divRef,
  onOpen,
}: {
  spot: ManualSpot
  divRef: Ref<HTMLButtonElement>
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const { x, y, w, h, rot, hand } = spot
  return (
    <button
      ref={divRef}
      type="button"
      onClick={onOpen}
      aria-label={t('padrinhos.open')}
      className="group absolute rounded-[2px] outline-none"
      style={{
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transformOrigin: 'center',
        visibility: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
        // Its tilt, before the scroll first places it.
        transform: `rotate(${rot}deg)`,
      }}
    >
      <span
        className="group-focus-visible:outline-forest absolute inset-0 block rounded-[2px] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-[3px] group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-hover:[box-shadow:var(--lifted)]"
        style={{ boxShadow: SHADOW, ['--lifted' as string]: LIFTED }}
      >
        <CoverFace w={w} h={h} />
      </span>
      <Note text={t('padrinhos.note')} hand={hand} w={w} />
    </button>
  )
}

/**
 * "For the wedding party", hand-written on the desk with a small arrow to
 * the card: under it on a wide screen, beside it (to its left) on a phone.
 */
function Note({ text, hand, w }: { text: string; hand: boolean; w: number }) {
  const size = Math.max(15, Math.min(22, w / 9))
  return (
    <span
      aria-hidden
      className={`text-amber-deep pointer-events-none absolute flex items-center whitespace-nowrap ${
        hand
          ? 'top-[38%] right-full mr-[0.3em] flex-row'
          : 'top-full left-1/2 -translate-x-1/2 flex-col-reverse pt-[0.15em]'
      }`}
      style={{ fontSize: size }}
    >
      <span className="font-script leading-[1.3]" style={{ fontSize: '1.35em' }}>
        {text}
      </span>
      <svg
        viewBox="0 0 40 30"
        className={`h-[1.5em] w-[2em] shrink-0 ${hand ? '' : '-mb-[0.1em] rotate-[-80deg]'}`}
      >
        <path
          d="M3 22c8-1 15-5 20-11 3-3.5 6-6 12-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M29.5 1.5 35.4 4l-4.3 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
