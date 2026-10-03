import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { InnovationForm, emptyInnovation } from '@/features/innovations/innovation-form'
import { notifyError, notifySuccess } from '@/features/panel/notify'
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
      <Link to="/panel/innovations" className={buttonVariants({ variant: 'ghost', className: 'self-start' })}>
        <IconArrowLeft aria-hidden="true" data-icon="inline-start" />
        Wszystkie innowacje
      </Link>
      <h1 className="text-2xl font-[650] tracking-[-0.02em]">Nowa innowacja</h1>
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
