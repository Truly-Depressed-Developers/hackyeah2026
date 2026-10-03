import { createFileRoute } from '@tanstack/react-router'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { IdeaWizard } from '@/features/idea/idea-wizard'
import { TOTAL_STEPS } from '@/features/idea/idea-form'

export const Route = createFileRoute('/pomysl')({
  validateSearch: (search: Record<string, unknown>): { q?: string; krok?: number } => {
    const q = typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined
    const krok = Number(search.krok)
    return { q, krok: Number.isInteger(krok) && krok >= 1 && krok <= TOTAL_STEPS + 1 ? krok : undefined }
  },
  component: IdeaRoute,
})

function IdeaRoute() {
  const { q, krok } = Route.useSearch()
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <IdeaWizard step={krok ?? 1} query={q} />
      </main>
      <SiteFooter />
    </div>
  )
}
