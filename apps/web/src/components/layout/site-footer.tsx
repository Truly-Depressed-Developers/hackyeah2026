import { Link } from '@tanstack/react-router'

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-6 text-sm text-muted-foreground sm:px-8">
      <span>Pomost · Regionalny Ośrodek Polityki Społecznej w Krakowie</span>
      <nav aria-label="Stopka" className="flex flex-wrap gap-x-5 gap-y-2">
        <Link to="/doradca" className="underline underline-offset-2 hover:text-foreground">
          Doradca grantowy dla instytucji
        </Link>
        <a href="#" className="underline-offset-2 hover:underline">
          Deklaracja dostępności
        </a>
        <a href="#" className="underline-offset-2 hover:underline">
          Prywatność
        </a>
      </nav>
    </footer>
  )
}
