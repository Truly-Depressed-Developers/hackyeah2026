import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import { formatDate, kindLabel, statusLabel, tierLabel, type SubmissionDetail, type SubmissionStatus } from './labels'

interface SubmissionDialogProps {
  id: string | undefined
  onClose: () => void
}

export function SubmissionDialog({ id, onClose }: SubmissionDialogProps) {
  const detail = useQuery({ ...trpc.panel.submissions.get.queryOptions({ id: id ?? '' }), enabled: Boolean(id) })

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {detail.data ? (
          <SubmissionDetails submission={detail.data} />
        ) : (
          <DialogHeader>
            <DialogTitle>{detail.isError ? 'Nie udało się wczytać zgłoszenia' : 'Wczytywanie zgłoszenia…'}</DialogTitle>
            {!detail.isError && <Skeleton className="h-40 w-full" />}
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubmissionDetails({ submission }: { submission: SubmissionDetail }) {
  const queryClient = useQueryClient()
  const setStatus = useMutation(
    trpc.panel.submissions.setStatus.mutationOptions({
      onSuccess: (updated) => {
        queryClient.setQueryData(trpc.panel.submissions.get.queryKey({ id: updated.id }), updated)
        return queryClient.invalidateQueries({ queryKey: trpc.panel.submissions.list.queryKey() })
      },
    }),
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {kindLabel[submission.kind]}
          {submission.idea && `: ${submission.idea.title}`}
        </DialogTitle>
        <DialogDescription>Zgłoszono {formatDate(submission.createdAt)}</DialogDescription>
      </DialogHeader>

      <Field>
        <FieldLabel htmlFor="submission-status">Stan</FieldLabel>
        <NativeSelect
          id="submission-status"
          value={submission.status}
          disabled={setStatus.isPending}
          onChange={(e) => setStatus.mutate({ id: submission.id, status: e.target.value as SubmissionStatus })}
        >
          {Object.entries(statusLabel).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p role="status" className="text-sm text-muted-foreground">
          {setStatus.isPending ? 'Zapisuję…' : setStatus.isSuccess ? 'Zapisano stan.' : ''}
        </p>
        {setStatus.isError && (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się zmienić stanu.
          </p>
        )}
      </Field>

      <section aria-labelledby="query-heading" className="flex flex-col gap-1">
        <h3 id="query-heading" className="font-medium">
          Zapytanie mieszkańca
        </h3>
        <p className="break-words">{submission.query}</p>
      </section>

      <section aria-labelledby="results-heading" className="flex flex-col gap-1">
        <h3 id="results-heading" className="font-medium">
          Co zobaczył mieszkaniec
        </h3>
        {submission.noMatch ? (
          <p>Brak odpowiedzi: wyszukiwarka nic nie znalazła.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {submission.shownResults.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center gap-2">
                <span>{result.title}</span>
                <Badge variant="outline">{tierLabel[result.tier]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="contact-heading" className="flex flex-col gap-1">
        <h3 id="contact-heading" className="font-medium">
          Kontakt
        </h3>
        {submission.contact ? (
          <p>
            {submission.contact}
            {submission.consentAt && (
              <span className="block text-sm text-muted-foreground">Zgoda: {formatDate(submission.consentAt)}</span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">Mieszkaniec nie zostawił kontaktu.</p>
        )}
      </section>

      {submission.idea && (
        <section aria-labelledby="idea-heading" className="flex flex-col gap-2">
          <h3 id="idea-heading" className="font-medium">
            Pomysł mieszkańca
          </h3>
          <dl className="flex flex-col gap-3">
            {submission.idea.answers.map((item, i) => (
              <div key={i}>
                <dt className="text-sm text-muted-foreground">{item.question}</dt>
                <dd className="break-words">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  )
}
