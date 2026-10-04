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
import { notifyError, notifySuccess } from '@/features/panel/notify'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/innovations/$innovationId')({
  component: EditInnovationPage,
})

function EditInnovationPage() {
  const { innovationId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const innovation = useQuery(trpc.panel.innovations.get.queryOptions({ id: innovationId }))
  const categories = useQuery(trpc.panel.innovations.categories.queryOptions())
  const update = useMutation(
    trpc.panel.innovations.update.mutationOptions({
      onSuccess: async (_, { data }) => {
        notifySuccess('Zapisano zmiany', data.title)
        await queryClient.invalidateQueries({ queryKey: trpc.panel.innovations.list.queryKey() })
        await navigate({ to: '/panel/innovations' })
      },
      onError: (error) => notifyError('Nie udało się zapisać zmian', error),
    }),
  )
  const [deleting, setDeleting] = useState(false)

  const ready = innovation.data && categories.data

  return (
    <>
      <Link to="/panel/innovations" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-mb-2 self-start text-muted-foreground' })}>
        <IconArrowLeft aria-hidden="true" data-icon="inline-start" />
        Wszystkie innowacje
      </Link>

      {ready && (
        <>
          <PageHeader
            section={PANEL_SECTIONS.innovations}
            documentTitle={'Edycja: ' + innovation.data.title}
            title={<span className="break-words">{innovation.data.title}</span>}
            description="Edycja innowacji. Po zapisaniu wyszukiwarka i katalog od razu pokazują zmiany."
            actions={
              <>
              <a href={`/innowacja/${encodeURIComponent(innovationId)}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline', className: 'bg-background/70' })}>
                <IconExternalLink aria-hidden="true" data-icon="inline-start" />
                Zobacz jak mieszkaniec
                <span className="sr-only"> (otwiera się w nowej karcie)</span>
              </a>
              <Button variant="destructive" onClick={() => setDeleting(true)}>
                <IconTrash aria-hidden="true" data-icon="inline-start" />
                Usuń
              </Button>
              </>
            }
          />

          <InnovationForm
            initial={toInput(innovation.data)}
            categories={categories.data}
            submitLabel="Zapisz zmiany"
            isPending={update.isPending}
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
  const { id: _id, categoryName: _name, categorySlug: _slug, featured: _featured, addedInPanel: _panel, categoryId, ...fields } = detail
  return { ...fields, categoryId: categoryId ?? 0 }
}
