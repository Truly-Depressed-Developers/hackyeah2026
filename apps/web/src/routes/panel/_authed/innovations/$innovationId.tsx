import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconExternalLink, IconTrash } from '@tabler/icons-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteInnovationDialog } from '@/features/innovations/delete-innovation-dialog'
import { InnovationForm } from '@/features/innovations/innovation-form'
import type { InnovationDetail } from '@/features/innovations/labels'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/innovations/$innovationId')({
  validateSearch: (search: Record<string, unknown>): { created?: boolean } => (search.created === true ? { created: true } : {}),
  component: EditInnovationPage,
})

function EditInnovationPage() {
  const { innovationId } = Route.useParams()
  const { created } = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const innovation = useQuery(trpc.panel.innovations.get.queryOptions({ id: innovationId }))
  const categories = useQuery(trpc.panel.innovations.categories.queryOptions())
  const update = useMutation(
    trpc.panel.innovations.update.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.panel.innovations.pathKey() }),
    }),
  )
  const [deleting, setDeleting] = useState(false)

  const ready = innovation.data && categories.data

  return (
    <>
      <Link to="/panel/innovations" className={buttonVariants({ variant: 'ghost', className: 'self-start' })}>
        <IconArrowLeft aria-hidden="true" data-icon="inline-start" />
        Wszystkie innowacje
      </Link>

      {ready && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-[650] tracking-[-0.02em] break-words">{innovation.data.title}</h1>
              <p className="text-muted-foreground">Edycja innowacji. Po zapisaniu wyszukiwarka i katalog od razu pokazują zmiany.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/innowacja/${encodeURIComponent(innovationId)}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
                <IconExternalLink aria-hidden="true" data-icon="inline-start" />
                Zobacz jak mieszkaniec
                <span className="sr-only"> (otwiera się w nowej karcie)</span>
              </a>
              <Button variant="destructive" onClick={() => setDeleting(true)}>
                <IconTrash aria-hidden="true" data-icon="inline-start" />
                Usuń
              </Button>
            </div>
          </div>

          <p role="status" className="text-sm font-medium">
            {update.isSuccess ? 'Zapisano zmiany.' : created ? 'Dodano innowację.' : ''}
          </p>

          <InnovationForm
            // Remount after a save so the form shows exactly what was stored.
            key={innovation.dataUpdatedAt}
            initial={toInput(innovation.data)}
            categories={categories.data}
            submitLabel="Zapisz zmiany"
            isPending={update.isPending}
            error={update.error?.message}
            onSubmit={(data) => update.mutate({ id: innovationId, data })}
          />
        </>
      )}

      {(innovation.isPending || categories.isPending) && <Skeleton className="h-96 w-full rounded-xl" />}
      {innovation.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {innovation.error.data?.code === 'NOT_FOUND' ? 'Nie ma takiej innowacji.' : `Nie udało się wczytać innowacji: ${innovation.error.message}`}
          </AlertDescription>
        </Alert>
      )}

      <DeleteInnovationDialog
        innovation={deleting && innovation.data ? { id: innovationId, title: innovation.data.title } : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => navigate({ to: '/panel/innovations' })}
      />
    </>
  )
}

function toInput(detail: InnovationDetail) {
  const { id: _id, categoryName: _name, featured: _featured, addedInPanel: _panel, categoryId, ...fields } = detail
  return { ...fields, categoryId: categoryId ?? 0 }
}
