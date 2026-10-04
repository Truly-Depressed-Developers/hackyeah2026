import { createFileRoute } from '@tanstack/react-router'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { TesterPage } from '@/features/tester/tester-page'

export const Route = createFileRoute('/testy')({
  // `pomysl` picks the Pomysł to sign up for, `krok=2` is the confirmation. Both survive a refresh.
  validateSearch: (search: Record<string, unknown>): { pomysl?: string; krok?: number } => {
    const pomysl = typeof search.pomysl === 'string' && search.pomysl ? search.pomysl : undefined
    const krok = Number(search.krok)
    return pomysl ? { pomysl, ...(krok === 2 ? { krok } : {}) } : {}
  },
  component: TesterRoute,
})

function TesterRoute() {
  const { pomysl, krok } = Route.useSearch()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <TesterPage ideaId={pomysl} step={krok} />
      </main>
      <SiteFooter />
    </div>
  )
}
