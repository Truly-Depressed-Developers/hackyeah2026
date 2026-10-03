import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

/** Changes a Pomysł's Stan. Potrzeby show their Pomysł's Stan, so their list refreshes too. */
export function useSetIdeaStatus() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.ideas.setStatus.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.panel.ideas.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.pathKey() }),
        ]),
    }),
  )
}
