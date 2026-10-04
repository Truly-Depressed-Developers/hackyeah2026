import { useCallback, useRef } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ListPagination } from '@/components/list-pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { kindLabel, type NeedKind } from '@/features/needs/labels'
import { NeedDialog } from '@/features/needs/need-dialog'
import { NeedsList } from '@/features/needs/needs-list'
import { useSetNeedStatus } from '@/features/needs/use-set-status'
import type { HandlingStatus } from '@/features/panel/handling'
import { DEFAULT_PAGE_SIZE, FilterBar, StatusFilter, TextSearch, listQuery, parseListSearch, type ListSearch } from '@/features/panel/list-controls'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { trpc } from '@/lib/trpc'

interface NeedsSearch extends ListSearch {
  kind?: NeedKind
  id?: string
}

export const Route = createFileRoute('/panel/_authed/needs')({
  validateSearch: (search: Record<string, unknown>): NeedsSearch => ({
    ...parseListSearch(search),
    kind: typeof search.kind === 'string' && search.kind in kindLabel ? (search.kind as NeedKind) : undefined,
    id: typeof search.id === 'string' ? search.id : undefined,
  }),
  component: NeedsPage,
})

function NeedsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const query = listQuery(search)

  const list = useQuery({
    ...trpc.panel.needs.list.queryOptions({ ...query, kind: search.kind }),
    placeholderData: keepPreviousData,
  })
  const setStatus = useSetNeedStatus()
  const { mutate: mutateStatus } = setStatus

  // Any filter change goes back to the first page.
  const update = (next: Partial<NeedsSearch>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...next }) })

  // After paging, focus the list heading so keyboard and screen-reader users land on the new page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pageSearch = (p: number) => ({ ...search, page: p > 1 ? p : undefined })
  const goToPage = (p: number) => navigate({ search: pageSearch(p) }).then(() => headingRef.current?.focus())
  const hrefFor = (p: number) => router.buildLocation({ to: '/panel/needs', search: pageSearch(p) }).href

  const openNeed = useCallback((id: string) => navigate({ search: (prev) => ({ ...prev, id }) }), [navigate])
  const changeStatus = useCallback((id: string, status: HandlingStatus) => mutateStatus({ id, status }), [mutateStatus])

  const data = list.data
  const caption = `Potrzeby, strona ${query.page}${data ? ` z ${data.pageCount}` : ''}`

  return (
    <>
      <PageHeader
        section={PANEL_SECTIONS.needs}
        title="Potrzeby mieszkańców"
        description="Wyszukiwania, w których mieszkaniec nie znalazł pomocy: Luki, Prośby o kontakt i te, z których powstał Pomysł."
      />

      <FilterBar>
        <TextSearch label="Szukaj w zapytaniach" value={search.q} onSearch={(q) => update({ q })} />
        <Field className="sm:w-48">
          <FieldLabel htmlFor="filter-kind">Rodzaj</FieldLabel>
          <NativeSelect
            id="filter-kind"
            className="w-full bg-background"
            value={search.kind ?? ''}
            onChange={(e) => update({ kind: (e.target.value || undefined) as NeedKind | undefined })}
          >
            <NativeSelectOption value="">Wszystkie</NativeSelectOption>
            {Object.entries(kindLabel).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <StatusFilter value={search.status} onChange={(status) => update({ status })} />
      </FilterBar>

      <section aria-labelledby="list-heading" className="flex flex-col gap-4">
        <h2 id="list-heading" ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          {caption}
        </h2>
        <p role="status" className="sr-only">
          {list.isFetching ? 'Wczytywanie…' : data ? `Znaleziono potrzeb: ${data.total}` : ''}
        </p>
        {list.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się wczytać potrzeb.</AlertDescription>
          </Alert>
        )}

        {!data && list.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
        {data && <NeedsList items={data.items} caption={caption} onOpen={openNeed} onSetStatus={changeStatus} />}
        {data && (
          <ListPagination
            label="Strony listy potrzeb"
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

      <NeedDialog id={search.id} onClose={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })} />
    </>
  )
}
