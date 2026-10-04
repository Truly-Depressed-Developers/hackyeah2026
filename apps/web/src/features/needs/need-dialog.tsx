import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/features/panel/handling'
import { StatusField } from '@/features/panel/status-field'
import { KindTag, Tag } from '@/features/panel/tags'
import { trpc } from '@/lib/trpc'
import { NeedStatus } from './columns'
import { kindLabel, tierLabel, type NeedDetail } from './labels'
import { useSetNeedStatus } from './use-set-status'

interface NeedDialogProps {
  id: string | undefined
  onClose: () => void
}

export function NeedDialog({ id, onClose }: NeedDialogProps) {
  const detail = useQuery({ ...trpc.panel.needs.get.queryOptions({ id: id ?? '' }), enabled: Boolean(id) })

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        {detail.data ? (
          <NeedDetails need={detail.data} />
        ) : (
          <DialogHeader>
            <DialogTitle>{detail.isError ? 'Nie udało się wczytać potrzeby' : 'Wczytywanie potrzeby…'}</DialogTitle>
            {!detail.isError && <Skeleton className="h-40 w-full" />}
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NeedDetails({ need }: { need: NeedDetail }) {
  const setStatus = useSetNeedStatus()

  return (
    <>
      <DialogHeader>
        <KindTag kind={need.kind} />
        <DialogTitle className="text-xl font-[650] tracking-[-0.02em]">{kindLabel[need.kind]}</DialogTitle>
        <DialogDescription>Zapisano {formatDate(need.createdAt)}</DialogDescription>
      </DialogHeader>

      {need.idea ? (
        // A Potrzeba that led to a Pomysł is handled on the Pomysł's own page.
        <section aria-labelledby="idea-heading" className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
          <h3 id="idea-heading" className="font-medium">
            Pomysł mieszkańca: {need.idea.title}
          </h3>
          <NeedStatus need={need} />
          <Link to="/panel/ideas/$ideaId" params={{ ideaId: need.idea.id }} className={buttonVariants({ className: 'self-start' })}>
            Przejdź do pomysłu
          </Link>
        </section>
      ) : (
        <StatusField
          id="need-status"
          value={need.status}
          onChange={(status) => setStatus.mutate({ id: need.id, status })}
          state={setStatus}
        />
      )}

      <section aria-labelledby="query-heading" className="flex flex-col gap-1">
        <h3 id="query-heading" className="font-medium">
          Zapytanie mieszkańca
        </h3>
        <p className="rounded-xl border-l-4 border-primary/50 bg-muted/50 px-4 py-3 break-words">„{need.query}”</p>
      </section>

      <section aria-labelledby="results-heading" className="flex flex-col gap-1">
        <h3 id="results-heading" className="font-medium">
          Co zobaczył mieszkaniec
        </h3>
        {need.noMatch ? (
          <p>Brak odpowiedzi: wyszukiwarka nic nie znalazła.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {need.shownResults.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center gap-2">
                <span>{result.title}</span>
                <Tag tone={result.tier === 'solution' ? 'green' : 'blue'}>{tierLabel[result.tier]}</Tag>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!need.idea && (
        <section aria-labelledby="contact-heading" className="flex flex-col gap-1">
          <h3 id="contact-heading" className="font-medium">
            Kontakt
          </h3>
          {need.contact ? (
            <p>
              {need.contact}
              {need.consentAt && <span className="block text-sm text-muted-foreground">Zgoda: {formatDate(need.consentAt)}</span>}
            </p>
          ) : (
            <p className="text-muted-foreground">Mieszkaniec nie zostawił kontaktu.</p>
          )}
        </section>
      )}
    </>
  )
}
