export function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-6 text-sm text-muted-foreground sm:px-8">
      <span>HubMI · Regionalny Ośrodek Polityki Społecznej w Krakowie</span>
      <nav aria-label="Informacje prawne" className="flex flex-wrap gap-x-5 gap-y-2">
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
