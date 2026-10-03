import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusLabel } from '@/features/panel/handling'
import { notifyError, notifySuccess } from '@/features/panel/notify'
import { trpc } from '@/lib/trpc'

/** Changes a Potrzeba's Stan and refreshes both the open details and the list. */
export function useSetNeedStatus() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.needs.setStatus.mutationOptions({
      onSuccess: (_, { status }) => {
        notifySuccess('Zmieniono stan potrzeby', `Nowy stan: ${statusLabel[status]}`)
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.get.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.list.queryKey() }),
        ])
      },
      onError: (error) => notifyError('Nie udało się zmienić stanu potrzeby', error),
    }),
  )
}
