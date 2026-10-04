import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowLeft } from '@tabler/icons-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetIdeaStatus } from '@/features/ideas/use-set-status'
import { useSetOpenForTesting } from '@/features/ideas/use-set-open-for-testing'
import type { IdeaDetail } from '@/features/ideas/labels'
import { formatDate, statusBadge, statusLabel } from '@/features/panel/handling'
import { StatusField } from '@/features/panel/status-field'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/ideas/$ideaId')({
  component: IdeaPage,
})

function IdeaPage() {
  const { ideaId } = Route.useParams()
  const idea = useQuery(trpc.panel.ideas.get.queryOptions({ id: ideaId }))

  return (
    <>
      <Link to="/panel/ideas" className={buttonVariants({ variant: 'ghost', className: 'self-start' })}>
        <IconArrowLeft aria-hidden="true" data-icon="inline-start" />
        Wszystkie pomysły
      </Link>

      {idea.data && <IdeaDetails idea={idea.data} />}
      {idea.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
      {idea.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>Nie udało się wczytać pomysłu.</AlertDescription>
        </Alert>
      )}
    </>
  )
}

function IdeaDetails({ idea }: { idea: IdeaDetail }) {
  const setStatus = useSetIdeaStatus()
  const setOpenForTesting = useSetOpenForTesting()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Badge variant={statusBadge[idea.status]}>{statusLabel[idea.status]}</Badge>
          <h1 className="text-2xl font-[650] tracking-[-0.02em] break-words">{idea.title}</h1>
          <p className="text-muted-foreground">Zgłoszono {formatDate(idea.createdAt)}</p>
        </div>

        <section aria-labelledby="answers-heading" className="flex flex-col gap-4">
          <h2 id="answers-heading" className="text-lg font-semibold">
            Odpowiedzi z formularza
          </h2>
          {idea.answers.length > 0 ? (
            <dl className="flex flex-col gap-4">
              {idea.answers.map((item, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-xl border p-4">
                  <dt className="text-sm text-muted-foreground">{item.question}</dt>
                  <dd className="break-words">{item.answer}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">Mieszkaniec podał tylko tytuł.</p>
          )}
        </section>

        <section aria-labelledby="testers-heading" className="flex flex-col gap-4">
          <h2 id="testers-heading" className="text-lg font-semibold">
            Chętni na testy
          </h2>
          {idea.testers.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {idea.testers.map((tester) => (
                <li key={tester.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border p-4">
                  <span className="font-medium break-words">{tester.name}</span>
                  <span className="break-all">{tester.contact}</span>
                  <span className="ml-auto text-sm whitespace-nowrap text-muted-foreground">
                    Zapisał(a) się {formatDate(tester.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {idea.openForTesting ? 'Nikt jeszcze się nie zapisał.' : 'Pomysł nie jest otwarty na testy.'}
            </p>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-4" aria-label="Obsługa pomysłu">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Obsługa</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusField
              id="idea-status"
              value={idea.status}
              onChange={(status) => setStatus.mutate({ id: idea.id, status })}
              state={setStatus}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Testy</h2>
            </CardTitle>
            <CardDescription>Otwarty pomysł trafia na publiczną listę, na której mieszkańcy zapisują się na testy.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <input
                id="idea-open-for-testing"
                type="checkbox"
                checked={idea.openForTesting}
                disabled={setOpenForTesting.isPending}
                onChange={(event) => setOpenForTesting.mutate({ id: idea.id, openForTesting: event.target.checked })}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <label htmlFor="idea-open-for-testing" className="text-sm">
                Szukamy testerów tego pomysłu
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Autor</h2>
            </CardTitle>
            <CardDescription>Zgoda na kontakt: {formatDate(idea.consentAt)}</CardDescription>
          </CardHeader>
          <CardContent className="break-words">{idea.contact}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Skąd pomysł</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {idea.need ? (
              <>
                <p className="break-words">„{idea.need.query}”</p>
                <Link
                  to="/panel/needs"
                  search={{ id: idea.need.id, status: 'all' }}
                  className={buttonVariants({ variant: 'outline', className: 'self-start' })}
                >
                  Zobacz potrzebę
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">Zgłoszony bez wyszukiwania.</p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
