import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InnovationForm, emptyInnovation } from '@/features/innovations/innovation-form'
import { notifyError, notifySuccess } from '@/features/panel/notify'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/innovations/new')({
  component: NewInnovationPage,
})

function NewInnovationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categories = useQuery(trpc.panel.innovations.categories.queryOptions())
  const create = useMutation(
    trpc.panel.innovations.create.mutationOptions({
      onSuccess: async (_, input) => {
        notifySuccess('Dodano innowację', input.title)
        await queryClient.invalidateQueries({ queryKey: trpc.panel.innovations.pathKey() })
        await navigate({ to: '/panel/innovations' })
      },
      onError: (error) => notifyError('Nie udało się dodać innowacji', error),
    }),
  )

  return (
    <>
      <Link to="/panel/innovations" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-mb-2 self-start text-muted-foreground' })}>
        <IconArrowLeft aria-hidden="true" data-icon="inline-start" />
        Wszystkie innowacje
      </Link>
      <PageHeader
        section={PANEL_SECTIONS.innovations}
        documentTitle="Nowa innowacja"
        title="Nowa innowacja"
        description="Opisz rozwiązanie tak, jak zobaczy je mieszkaniec. Po zapisaniu wyszukiwarka od razu zacznie je podpowiadać."
      />
      {categories.data ? (
        <InnovationForm
          initial={emptyInnovation}
          categories={categories.data}
          submitLabel="Dodaj innowację"
          isPending={create.isPending}
          onSubmit={(data) => create.mutate(data)}
        />
      ) : (
        <Skeleton className="h-96 w-full rounded-xl" />
      )}
    </>
  )
}
