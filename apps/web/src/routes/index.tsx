import { useEffect, useRef, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { SearchResults, summarize } from '@/components/search/search-results'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { $ai, SEARCH_COLLECTION } from '@/lib/ai/client'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    const q = typeof search.q === 'string' ? search.q.trim() : ''
    return q ? { q } : {}
  },
  component: SearchPage,
})

function SearchPage() {
  const { q } = Route.useSearch()
  const navigate = Route.useNavigate()

  const search = $ai.useQuery(
    'post',
    '/search',
    { body: { collection: SEARCH_COLLECTION, query: q ?? '' } },
    { enabled: Boolean(q), staleTime: Infinity, retry: false },
  )

  // Brak odpowiedzi is saved as a Luka for the Panel administratora, once per Zapytanie.
  // gap?.id is the gapId the S-03 forms pass to submissions.submit to upgrade this Luka.
  const { mutate: recordGap } = useMutation(trpc.submissions.recordGap.mutationOptions())
  const recordedQuery = useRef<string | null>(null)
  useEffect(() => {
    if (!q || !search.data?.noMatch || recordedQuery.current === q) return
    recordedQuery.current = q
    recordGap({ query: q })
  }, [q, search.data, recordGap])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    if (!query) return
    // replace: no history entry, so a shared kiosk doesn't keep the previous resident's query.
    navigate({ search: { q: query }, replace: true })
  }

  const status = search.isFetching
    ? 'Szukam rozwiązań…'
    : search.isSuccess
      ? summarize(search.data)
      : ''

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <nav className="flex justify-end">
        {/* Entry to the Panel administratora; logged-out users land on /panel/login. */}
        <Link to="/panel" className={buttonVariants({ size: "sm" })}>
          Zaloguj się
        </Link>
      </nav>
      <h1 className="text-2xl font-bold sm:text-3xl">Znajdź rozwiązanie swojego problemu</h1>

      <form role="search" onSubmit={onSubmit} className="flex flex-col gap-2">
        <Label htmlFor="q" className="text-base">
          Opisz problem lub potrzebę własnymi słowami
        </Label>
        <p id="q-hint" className="text-sm text-muted-foreground">
          Np. „mama sama nie daje rady z opieką nad tatą po udarze”
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="q"
            name="q"
            type="search"
            required
            defaultValue={q}
            enterKeyHint="search"
            aria-describedby="q-hint"
            className="h-12 text-base md:text-base"
          />
          <Button type="submit" className="h-12 px-5 text-base">
            <Search aria-hidden="true" />
            Szukaj
          </Button>
        </div>
      </form>

      <p role="status" className="min-h-6 text-muted-foreground">
        {status}
      </p>

      {search.isError && !search.isFetching && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive p-4">
          <p className="font-semibold text-destructive">Coś poszło nie tak i nie udało się wyszukać.</p>
          <Button variant="outline" className="h-11 px-4" onClick={() => search.refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {search.isSuccess && !search.isFetching && <SearchResults data={search.data} />}
    </div>
  )
}
