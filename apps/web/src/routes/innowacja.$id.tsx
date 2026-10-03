import { createFileRoute } from '@tanstack/react-router'
import { InnovationPage } from '@/components/innovation/innovation-page'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'

export const Route = createFileRoute('/innowacja/$id')({
  component: InnovationRoute,
})

function InnovationRoute() {
  const { id } = Route.useParams()
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <InnovationPage key={id} id={id} />
      </main>
      <SiteFooter />
    </div>
  )
}
