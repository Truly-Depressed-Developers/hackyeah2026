import { useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { IconPlus } from '@tabler/icons-react'
import { ListPagination } from '@/components/list-pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteInnovationDialog } from '@/features/innovations/delete-innovation-dialog'
import { InnovationsList } from '@/features/innovations/innovations-list'
import type { InnovationRow } from '@/features/innovations/labels'
import { DEFAULT_PAGE_SIZE, TextSearch, listQuery, parseListSearch, type ListSearch } from '@/features/panel/list-controls'
import { trpc } from '@/lib/trpc'

interface InnovationsSearch extends Omit<ListSearch, 'status'> {
  category?: number
}

export const Route = createFileRoute('/panel/_authed/innovations/')({
  validateSearch: (search: Record<string, unknown>): InnovationsSearch => {
    const { status: _status, ...list } = parseListSearch(search)
    const category = Number(search.category)
    return { ...list, category: Number.isInteger(category) && category > 0 ? category : undefined }
  },
  component: InnovationsPage,
})

function InnovationsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const { page, pageSize, q } = listQuery(search)

  const categories = useQuery(trpc.panel.innovations.categories.queryOptions())
  const list = useQuery({
    ...trpc.panel.innovations.list.queryOptions({ page, pageSize, q, categoryId: search.category }),
    placeholderData: keepPreviousData,
  })
  const [toDelete, setToDelete] = useState<InnovationRow | null>(null)

  // Any filter change goes back to the first page.
  const update = (next: Partial<InnovationsSearch>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...next }) })

  // After paging, focus the list heading so keyboard and screen-reader users land on the new page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pageSearch = (p: number) => ({ ...search, page: p > 1 ? p : undefined })
  const goToPage = (p: number) => navigate({ search: pageSearch(p) }).then(() => headingRef.current?.focus())
  const hrefFor = (p: number) => router.buildLocation({ to: '/panel/innovations', search: pageSearch(p) }).href

  const data = list.data
  const caption = `Innowacje, strona ${page}${data ? ` z ${data.pageCount}` : ''}`

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-[650] tracking-[-0.02em]">Baza wiedzy: innowacje</h1>
          <p className="text-muted-foreground">To, co wyszukiwarka podpowiada mieszkańcom. Zmiany widać od razu w wyszukiwarce i katalogu.</p>
        </div>
        <Link to="/panel/innovations/new" className={buttonVariants()}>
          <IconPlus aria-hidden="true" data-icon="inline-start" />
          Dodaj innowację
        </Link>
      </div>

      <section aria-label="Filtry" className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <TextSearch label="Szukaj w tytułach" value={search.q} onSearch={(next) => update({ q: next })} />
        <Field className="sm:w-72">
          <FieldLabel htmlFor="filter-category">Kategoria</FieldLabel>
          <NativeSelect
            id="filter-category"
            className="w-full bg-background"
            value={search.category ?? ''}
            onChange={(e) => update({ category: Number(e.target.value) || undefined })}
          >
            <NativeSelectOption value="">Wszystkie</NativeSelectOption>
            {categories.data?.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </section>

      <section aria-labelledby="list-heading" className="flex flex-col gap-4">
        <h2 id="list-heading" ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          {caption}
        </h2>
        <p role="status" className="sr-only">
          {list.isFetching ? 'Wczytywanie…' : data ? `Znaleziono innowacji: ${data.total}` : ''}
        </p>
        {list.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się wczytać innowacji: {list.error.message}</AlertDescription>
          </Alert>
        )}

        {!data && list.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
        {data && <InnovationsList items={data.items} caption={caption} onDelete={setToDelete} />}
        {data && (
          <ListPagination
            label="Strony listy innowacji"
            page={page}
            pageCount={data.pageCount}
            pageSize={pageSize}
            total={data.total}
            hrefFor={hrefFor}
            onPageChange={goToPage}
            onPageSizeChange={(size) => update({ size: size === DEFAULT_PAGE_SIZE ? undefined : size })}
          />
        )}
      </section>

      <DeleteInnovationDialog innovation={toDelete} onClose={() => setToDelete(null)} />
    </>
  )
}
