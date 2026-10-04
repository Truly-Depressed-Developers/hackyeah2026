import { useRef } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ListPagination } from '@/components/list-pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { IdeasList } from '@/features/ideas/ideas-list'
import { DEFAULT_PAGE_SIZE, FilterBar, StatusFilter, TextSearch, listQuery, parseListSearch, type ListSearch } from '@/features/panel/list-controls'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/panel/_authed/ideas/')({
  validateSearch: (search: Record<string, unknown>): ListSearch => parseListSearch(search),
  component: IdeasPage,
})

function IdeasPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const query = listQuery(search)

  const list = useQuery({ ...trpc.panel.ideas.list.queryOptions(query), placeholderData: keepPreviousData })

  // Any filter change goes back to the first page.
  const update = (next: Partial<ListSearch>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...next }) })

  // After paging, focus the list heading so keyboard and screen-reader users land on the new page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pageSearch = (p: number) => ({ ...search, page: p > 1 ? p : undefined })
  const goToPage = (p: number) => navigate({ search: pageSearch(p) }).then(() => headingRef.current?.focus())
  const hrefFor = (p: number) => router.buildLocation({ to: '/panel/ideas', search: pageSearch(p) }).href

  const data = list.data
  const caption = `Pomysły, strona ${query.page}${data ? ` z ${data.pageCount}` : ''}`

  return (
    <>
      <PageHeader
        section={PANEL_SECTIONS.ideas}
        title="Pomysły mieszkańców"
        description="Rozwiązania zaproponowane przez mieszkańców, zwykle tam, gdzie wyszukiwarka nie pomogła."
      />

      <FilterBar>
        <TextSearch label="Szukaj w tytułach" value={search.q} onSearch={(q) => update({ q })} />
        <StatusFilter value={search.status} onChange={(status) => update({ status })} />
      </FilterBar>

      <section aria-labelledby="list-heading" className="flex flex-col gap-4">
        <h2 id="list-heading" ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          {caption}
        </h2>
        <p role="status" className="sr-only">
          {list.isFetching ? 'Wczytywanie…' : data ? `Znaleziono pomysłów: ${data.total}` : ''}
        </p>
        {list.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się wczytać pomysłów.</AlertDescription>
          </Alert>
        )}

        {!data && list.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
        {data && <IdeasList items={data.items} caption={caption} />}
        {data && (
          <ListPagination
            label="Strony listy pomysłów"
            page={query.page}
            pageCount={data.pageCount}
            pageSize={query.pageSize}
            total={data.total}
            hrefFor={hrefFor}
            onPageChange={goToPage}
            onPageSizeChange={(size) => update({ size: size === DEFAULT_PAGE_SIZE ? undefined : size })}
          />
        )}
      </section>
    </>
  )
}
