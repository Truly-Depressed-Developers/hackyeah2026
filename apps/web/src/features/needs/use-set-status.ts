import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

/** Changes a Potrzeba's Stan and refreshes both the open details and the list. */
export function useSetNeedStatus() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.needs.setStatus.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.get.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.panel.needs.list.queryKey() }),
        ]),
    }),
  )
}
