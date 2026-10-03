import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { trpc } from '@/lib/trpc'

interface DeleteInnovationDialogProps {
  innovation: { id: string; title: string } | null
  onClose: () => void
  onDeleted?: () => void
}

/** The AI service deletes for good, so the Pracownik confirms with the title in front of them. */
export function DeleteInnovationDialog({ innovation, onClose, onDeleted }: DeleteInnovationDialogProps) {
  const queryClient = useQueryClient()
  const remove = useMutation(
    trpc.panel.innovations.delete.mutationOptions({
      onSuccess: (_, { id }) => {
        // Drop the deleted one's details rather than refetching them into a 404.
        queryClient.removeQueries({ queryKey: trpc.panel.innovations.get.queryKey({ id }) })
        void queryClient.invalidateQueries({ queryKey: trpc.panel.innovations.list.queryKey() })
        onClose()
        onDeleted?.()
      },
    }),
  )

  return (
    <AlertDialog open={Boolean(innovation)} onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usunąć innowację?</AlertDialogTitle>
          <AlertDialogDescription>
            „{innovation?.title}” zniknie z bazy wiedzy, wyszukiwarki i katalogu. Tej operacji nie da się cofnąć.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError && (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się usunąć: {remove.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => innovation && remove.mutate({ id: innovation.id })}
          >
            {remove.isPending && <Spinner data-icon="inline-start" />}
            Usuń na stałe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
