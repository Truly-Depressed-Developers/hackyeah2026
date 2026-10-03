import { useCallback, useRef, type FormEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { IconSearch } from '@tabler/icons-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { kindLabel, statusLabel, type SubmissionKind, type SubmissionStatus } from '@/features/submissions/labels'
import { SubmissionDialog } from '@/features/submissions/submission-dialog'
import { SubmissionsList } from '@/features/submissions/submissions-list'
import { PAGE_SIZES, SubmissionsPagination, type PageSize } from '@/features/submissions/submissions-pagination'
import { useSetSubmissionStatus } from '@/features/submissions/use-set-status'
import { trpc } from '@/lib/trpc'

interface SubmissionsSearch {
  page?: number
  size?: PageSize
  kind?: SubmissionKind
  status?: SubmissionStatus | 'all'
  q?: string
  id?: string
}

const pick = <T extends string>(value: unknown, allowed: Record<T, string>) =>
  typeof value === 'string' && value in allowed ? (value as T) : undefined

const DEFAULT_SIZE: PageSize = 20

// Filters, page and the open Zgłoszenie live in the URL, so a view can be refreshed or shared with a colleague.
export const Route = createFileRoute('/panel/_authed/submissions')({
  validateSearch: (search: Record<string, unknown>): SubmissionsSearch => {
    const page = Number(search.page)
    const size = Number(search.size)
    const q = typeof search.q === 'string' ? search.q.trim() : ''
    return {
      page: Number.isInteger(page) && page > 1 ? page : undefined,
      size: PAGE_SIZES.includes(size as PageSize) && size !== DEFAULT_SIZE ? (size as PageSize) : undefined,
      kind: pick(search.kind, kindLabel),
      // No status param means the default view: Nowe. "all" shows every Stan.
      status: search.status === 'all' ? 'all' : (pick(search.status, statusLabel) ?? 'new'),
      q: q || undefined,
      id: typeof search.id === 'string' ? search.id : undefined,
    }
  },
  component: SubmissionsPage,
})

function SubmissionsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const page = search.page ?? 1
  const pageSize = search.size ?? DEFAULT_SIZE
  const status = search.status === 'all' ? undefined : search.status

  const list = useQuery({
    ...trpc.panel.submissions.list.queryOptions({ page, pageSize, kind: search.kind, status, q: search.q }),
    placeholderData: keepPreviousData,
  })
  const setStatus = useSetSubmissionStatus()
  const { mutate: mutateStatus } = setStatus

  // Any filter change goes back to the first page.
  const update = (next: Partial<SubmissionsSearch>) => navigate({ search: (prev) => ({ ...prev, page: undefined, ...next }) })

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    update({ q: q || undefined })
  }

  // After paging, focus the list heading so keyboard and screen-reader users land on the new page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pageSearch = (p: number) => ({ ...search, page: p > 1 ? p : undefined })
  const goToPage = (p: number) => navigate({ search: pageSearch(p) }).then(() => headingRef.current?.focus())
  const hrefFor = (p: number) => router.buildLocation({ to: '/panel/submissions', search: pageSearch(p) }).href

  const openSubmission = useCallback((id: string) => navigate({ search: (prev) => ({ ...prev, id }) }), [navigate])
  const changeStatus = useCallback(
    (id: string, next: SubmissionStatus) => mutateStatus({ id, status: next }),
    [mutateStatus],
  )

  const data = list.data
  const caption = `Zgłoszenia, strona ${page}${data ? ` z ${data.pageCount}` : ''}`

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-[650] tracking-[-0.02em]">Zgłoszenia mieszkańców</h1>
        <p className="text-muted-foreground">Luki, Pomysły i Prośby o kontakt od mieszkańców, którzy nie znaleźli pomocy.</p>
      </div>

      <section aria-label="Filtry" className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <form role="search" aria-label="Szukaj w zapytaniach" onSubmit={onSearch} className="flex flex-1 flex-col gap-2 sm:min-w-64">
          <label htmlFor="filter-q" className="text-sm font-medium">
            Szukaj w zapytaniach
          </label>
          <div className="flex gap-2">
            <Input id="filter-q" name="q" type="search" defaultValue={search.q} key={search.q} className="bg-background" />
            <Button type="submit">
              <IconSearch aria-hidden="true" data-icon="inline-start" />
              Szukaj
            </Button>
          </div>
        </form>

        <Field className="sm:w-48">
          <FieldLabel htmlFor="filter-kind">Rodzaj</FieldLabel>
          <NativeSelect
            id="filter-kind"
            className="w-full bg-background"
            value={search.kind ?? ''}
            onChange={(e) => update({ kind: (e.target.value || undefined) as SubmissionKind | undefined })}
          >
            <NativeSelectOption value="">Wszystkie</NativeSelectOption>
            {Object.entries(kindLabel).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field className="sm:w-48">
          <FieldLabel htmlFor="filter-status">Stan</FieldLabel>
          <NativeSelect
            id="filter-status"
            className="w-full bg-background"
            value={search.status ?? 'new'}
            onChange={(e) => update({ status: e.target.value as SubmissionStatus | 'all' })}
          >
            <NativeSelectOption value="all">Wszystkie</NativeSelectOption>
            {Object.entries(statusLabel).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
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
          {list.isFetching ? 'Wczytywanie…' : data ? `Znaleziono zgłoszeń: ${data.total}` : ''}
        </p>
        {setStatus.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się zmienić stanu zgłoszenia.</AlertDescription>
          </Alert>
        )}
        {list.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się wczytać zgłoszeń.</AlertDescription>
          </Alert>
        )}

        {!data && list.isPending && <Skeleton className="h-96 w-full rounded-xl" />}
        {data && <SubmissionsList items={data.items} caption={caption} onOpen={openSubmission} onSetStatus={changeStatus} />}
        {data && (
          <SubmissionsPagination
            page={page}
            pageCount={data.pageCount}
            pageSize={pageSize}
            total={data.total}
            hrefFor={hrefFor}
            onPageChange={goToPage}
            onPageSizeChange={(size) => update({ size: size === DEFAULT_SIZE ? undefined : size })}
          />
        )}
      </section>

      <SubmissionDialog id={search.id} onClose={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })} />
    </>
  )
}
