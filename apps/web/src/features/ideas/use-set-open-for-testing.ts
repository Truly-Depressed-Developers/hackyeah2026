import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifyError, notifySuccess } from '@/features/panel/notify'
import { trpc } from '@/lib/trpc'

/** Opens a Pomysł for Testerzy, or closes it again. This is what puts it on the public /testy list. */
export function useSetOpenForTesting() {
  const queryClient = useQueryClient()
  return useMutation(
    trpc.panel.ideas.setOpenForTesting.mutationOptions({
      onSuccess: (_, { openForTesting }) => {
        notifySuccess(
          openForTesting ? 'Pomysł otwarty na testy' : 'Pomysł zamknięty na testy',
          openForTesting ? 'Mieszkańcy mogą się teraz zapisać.' : 'Nie jest już widoczny dla mieszkańców.',
        )
        return queryClient.invalidateQueries({ queryKey: trpc.panel.ideas.pathKey() })
      },
      onError: (error) => notifyError('Nie udało się zmienić ustawienia testów', error),
    }),
  )
}
