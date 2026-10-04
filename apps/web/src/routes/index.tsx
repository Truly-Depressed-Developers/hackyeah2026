import { useState, type FormEvent } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowLeft, IconSearch } from '@tabler/icons-react'
import { KnowledgeBase } from '@/components/catalog/knowledge-base'
import { ActionDock } from '@/components/layout/action-dock'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { SearchResults, summarize } from '@/components/search/search-results'
import { VoiceSearch } from '@/components/search/voice-search'
import { Button } from '@/components/ui/button'
import { NoResult } from '@/features/no-result/no-result'
import { SearchProgress } from '@/features/search-progress/search-progress'
import { $ai, SEARCH_COLLECTION } from '@/lib/ai/client'
import { markVoiceInput } from '@/lib/analytics'
import { useSearchTracking } from '@/lib/use-analytics'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === 'string' ? search.q.trim() : ''
    return q ? { q } : {}
  },
  component: StartPage,
})

function StartPage() {
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()
  const [draft, setDraft] = useState(q ?? '')
  const [syncedQ, setSyncedQ] = useState(q)

  // Reset the field when the URL changes from outside the form (logo, "Wróć…" links).
  if (syncedQ !== q) {
    setSyncedQ(q)
    setDraft(q ?? '')
  }

  const search = $ai.useQuery(
    'post',
    '/search',
    { body: { collection: SEARCH_COLLECTION, query: q ?? '' } },
    { enabled: Boolean(q), staleTime: Infinity, retry: false },
  )
  useSearchTracking(q, search)

  // replace: no history entry, so a shared kiosk doesn't keep the previous resident's query.
  function runSearch(query: string) {
    navigate({ search: query ? { q: query } : {}, replace: true })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    runSearch(draft.trim())
  }

  const noMatch = search.isSuccess && !search.isFetching && search.data.noMatch
  const status = search.isFetching ? 'Szukam rozwiązań…' : search.isSuccess ? summarize(search.data) : ''

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section
          aria-labelledby="hero-title"
          className="flex flex-col items-center overflow-hidden border-b bg-hero-gradient px-4 pt-14 pb-16 text-center sm:px-6 sm:pt-[4.5rem] sm:pb-[4.75rem]"
        >
          <div className="flex w-full max-w-[53.75rem] flex-col items-center">
            <h1 id="hero-title" className="text-4xl leading-[1.1] font-[650] tracking-[-0.04em] sm:text-[3.25rem]">
              W czym możemy Ci pomóc?
            </h1>
            <p id="hero-hint" className="mt-4 max-w-[35rem] text-lg leading-7 text-muted-foreground sm:text-[1.1875rem]">
              Napisz lub powiedz, z czym masz kłopot. Podpowiemy, gdzie szukać pomocy w Małopolsce.
            </p>

            <form role="search" aria-label="Wyszukaj rozwiązanie" onSubmit={onSubmit} className="mt-11 flex w-full items-center gap-3 sm:gap-4">
              <div className="flex h-16 min-w-0 flex-1 items-center gap-2.5 rounded-full border bg-card py-0 pr-2 pl-5 text-left shadow-[0_12px_32px_-12px_rgb(15_27_45/0.12)] focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgb(34_99_173/0.18),0_12px_32px_-12px_rgb(15_27_45/0.14)] sm:h-[4.75rem] sm:pr-2.5 sm:pl-7">
                <label htmlFor="q" className="sr-only">
                  Opisz swój problem lub potrzebę
                </label>
                <input
                  id="q"
                  name="q"
                  type="search"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  enterKeyHint="search"
                  aria-describedby="hero-hint"
                  placeholder="Np. mama po udarze potrzebuje opieki w domu"
                  className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-[1.1875rem]"
                />
                <Button type="submit" className="h-12 shrink-0 rounded-full px-5 text-base font-semibold shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] sm:h-14 sm:px-7">
                  <IconSearch aria-hidden="true" className="sm:hidden" />
                  <span className="max-sm:sr-only">Szukaj</span>
                </Button>
              </div>
              <VoiceSearch
                onSearch={(query) => {
                  markVoiceInput()
                  runSearch(query)
                }}
              />
            </form>
          </div>
        </section>

        {q && noMatch ? (
          <NoResult query={q} onBrowse={() => navigate({ search: {}, replace: true })} />
        ) : q ? (
          <section aria-label="Wyniki wyszukiwania" className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
            <Link to="/" search={{}} replace className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm text-primary underline-offset-2 hover:text-primary-strong hover:underline">
              <IconArrowLeft aria-hidden="true" className="size-4" />
              Wróć do bazy wiedzy
            </Link>

            {/* Podczas szukania narrację prowadzi SearchProgress, więc nie dublujemy komunikatu. */}
            {!search.isFetching && (
              <p role="status" className="min-h-6 text-muted-foreground">
                {status}
              </p>
            )}

            {search.isFetching && <SearchProgress />}

            {search.isError && !search.isFetching && (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive p-4">
                <p className="font-semibold text-destructive">Coś poszło nie tak i nie udało się wyszukać.</p>
                <Button variant="outline" className="h-11 px-4" onClick={() => search.refetch()}>
                  Spróbuj ponownie
                </Button>
              </div>
            )}

            {search.isSuccess && !search.isFetching && <SearchResults data={search.data} />}
          </section>
        ) : (
          <KnowledgeBase />
        )}

        <ActionDock />
      </main>
      <SiteFooter />
    </div>
  )
}
