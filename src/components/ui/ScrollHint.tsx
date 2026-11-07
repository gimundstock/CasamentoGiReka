/** tailwind.config's `nudge` animation's period. */
export const NUDGE_MS = 2200

interface Props {
  label: string
  /**
   * Animation delay for the chevron, from `useClockDelay(NUDGE_MS)`: two
   * copies that hand over from one to the other (the desk's envelope and the
   * invitation's) then nudge in step.
   */
  delay?: string
}

/**
 * The one "scroll to …" line of the site: small spaced capitals with a
 * chevron nudging downwards. Inline, so it fits inside a <p> or a <div>;
 * the parent centers it.
 */
export function ScrollHint({ label, delay }: Props) {
  return (
    <span className="font-sans inline-flex items-center justify-center gap-[0.6em] px-4 text-center text-[0.625rem] tracking-[0.28em] text-[#75624A] uppercase">
      <span>{label}</span>
      <svg
        viewBox="0 0 24 24"
        className="animate-nudge h-[1.4em] w-[1.4em] shrink-0"
        style={{ animationDelay: delay }}
        aria-hidden
      >
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
