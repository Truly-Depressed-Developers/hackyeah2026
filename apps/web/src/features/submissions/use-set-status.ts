import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'

/** Changes a Zgłoszenie's Stan and refreshes both the open details and the list. */
export function useSetSubmissionStatus() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.submissions.setStatus.mutationOptions({
      onSuccess: (updated) => {
        queryClient.setQueryData(trpc.panel.submissions.get.queryKey({ id: updated.id }), updated)
        return queryClient.invalidateQueries({ queryKey: trpc.panel.submissions.list.queryKey() })
      },
    }),
  )
}
