import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()

  function toggle() {
    i18n.changeLanguage(i18n.language === 'pt' ? 'en' : 'pt')
  }

  return (
    <button
      onClick={toggle}
      className="text-xs font-sans tracking-widest uppercase text-forest border border-forest/40 px-3 py-1 rounded-full hover:bg-forest hover:text-peach transition-colors duration-200"
      aria-label="Switch language"
    >
      {t('language')}
    </button>
  )
}
