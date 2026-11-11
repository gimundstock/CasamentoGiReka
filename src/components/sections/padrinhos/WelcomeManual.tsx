import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PadrinhosManual } from './PadrinhosManual'
import { manualPublished, useDeskScene } from './available'

/**
 * The manual on the welcome screen, for a padrinho whose screen has no desk
 * scene (a tablet, a phone on its side, reduced motion): there the manual
 * cannot lie beside the passport, so it is offered here, as a quiet line.
 */
export function WelcomeManual({ padrinho }: { padrinho?: boolean }) {
  const { t } = useTranslation()
  const desk = useDeskScene()
  const [open, setOpen] = useState(false)
  if (!padrinho || !manualPublished() || desk) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-garamond text-amber-deep hover:text-cta relative z-10 mx-auto mt-2 block py-3 text-base italic transition-colors"
      >
        {t('padrinhos.welcome')}
      </button>
      <PadrinhosManual open={open} onClose={() => setOpen(false)} />
    </>
  )
}
