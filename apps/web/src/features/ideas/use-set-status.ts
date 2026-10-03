import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusLabel } from '@/features/panel/handling'
import { notifyError, notifySuccess } from '@/features/panel/notify'
import { trpc } from '@/lib/trpc'

/** Changes a Pomysł's Stan. Potrzeby show their Pomysł's Stan, so their list refreshes too. */
export function useSetIdeaStatus() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.ideas.setStatus.mutationOptions({
      onSuccess: (_, { status }) => {
        notifySuccess('Zmieniono stan pomysłu', `Nowy stan: ${statusLabel[status]}`)
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.panel.ideas.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.pathKey() }),
        ])
      },
      onError: (error) => notifyError('Nie udało się zmienić stanu pomysłu', error),
    }),
  )
}
