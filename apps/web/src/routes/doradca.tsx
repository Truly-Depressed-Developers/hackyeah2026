import { createFileRoute } from '@tanstack/react-router'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { AdvisorPage } from '@/features/advisor/advisor-page'

export const Route = createFileRoute('/doradca')({
  // `q` prefills the idea, e.g. from "Sprawdź finansowanie" on an innovation page.
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === 'string' ? search.q.trim().slice(0, 1500) : ''
    return q ? { q } : {}
  },
  component: AdvisorRoute,
})

function AdvisorRoute() {
  const { q } = Route.useSearch()
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <AdvisorPage initialQuery={q} />
      </main>
      <SiteFooter />
    </div>
  )
}
