import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowLeft, IconCalendar } from '@tabler/icons-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSetIdeaStatus } from '@/features/ideas/use-set-status'
import type { IdeaDetail } from '@/features/ideas/labels'
import { formatDate } from '@/features/panel/handling'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { StatusField } from '@/features/panel/status-field'
import { StatusTag, Tag } from '@/features/panel/tags'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/ideas/$ideaId')({
  component: IdeaPage,
})

function IdeaPage() {
  const { ideaId } = Route.useParams()
  const idea = useQuery(trpc.panel.ideas.get.queryOptions({ id: ideaId }))

  return (
    <>
      <Link to="/panel/ideas" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-mb-2 self-start text-muted-foreground' })}>
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

  return (
    <>
      <PageHeader
        section={PANEL_SECTIONS.ideas}
        documentTitle={'Pomysł: ' + idea.title}
        title={<span className="break-words">{idea.title}</span>}
        meta={
          <>
            <StatusTag status={idea.status} />
            <Tag tone="slate" icon={IconCalendar}>
              Zgłoszono {formatDate(idea.createdAt)}
            </Tag>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="answers-heading" className="flex flex-col gap-4">
            <h2 id="answers-heading" className="text-lg font-semibold">
              Odpowiedzi z formularza
            </h2>
            {idea.answers.length > 0 ? (
              <dl className="flex flex-col gap-4">
                {idea.answers.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4 shadow-xs">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-900 tabular-nums dark:bg-teal-400/15 dark:text-teal-100"
                      >
                        {i + 1}
                      </span>
                      {item.question}
                    </dt>
                    <dd className="break-words pl-8">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground">Mieszkaniec podał tylko tytuł.</p>
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
    </>
  )
}
