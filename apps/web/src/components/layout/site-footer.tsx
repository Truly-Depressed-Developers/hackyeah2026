import { Link } from '@tanstack/react-router'
import { useT } from '@/lib/i18n'

export function SiteFooter() {
  const t = useT()
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-6 text-sm text-muted-foreground sm:px-8">
      <span>{t('Pomost · Regionalny Ośrodek Polityki Społecznej w Krakowie', 'Pomost · Regional Centre for Social Policy in Kraków')}</span>
      <nav aria-label={t('Stopka', 'Footer')} className="flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/doradca" className="underline underline-offset-2 hover:text-foreground">
          {t('Doradca grantowy dla instytucji', 'Grant advisor for institutions')}
        </Link>
        <a href="#" className="underline-offset-2 hover:underline">
          {t('Deklaracja dostępności', 'Accessibility statement')}
        </a>
        <a href="#" className="underline-offset-2 hover:underline">
          {t('Prywatność', 'Privacy')}
        </a>
      </nav>
    </footer>
  )
}
