import { useRef, type FormEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { kindLabel, statusLabel, type SubmissionKind, type SubmissionStatus } from '@/features/submissions/labels'
import { SubmissionDialog } from '@/features/submissions/submission-dialog'
import { SubmissionsList } from '@/features/submissions/submissions-list'
import { trpc } from '@/lib/trpc'

interface SubmissionsSearch {
  page?: number
  kind?: SubmissionKind
  status?: SubmissionStatus | 'all'
  q?: string
  id?: string
}

const pick = <T extends string>(value: unknown, allowed: Record<T, string>) =>
  typeof value === 'string' && value in allowed ? (value as T) : undefined

// Filters, page and the open Zgłoszenie live in the URL, so a view can be refreshed or shared with a colleague.
export const Route = createFileRoute('/panel/_authed/zgloszenia')({
  validateSearch: (search: Record<string, unknown>): SubmissionsSearch => {
    const page = Number(search.page)
    const q = typeof search.q === 'string' ? search.q.trim() : ''
    return {
      page: Number.isInteger(page) && page > 1 ? page : undefined,
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
  const page = search.page ?? 1
  const status = search.status === 'all' ? undefined : search.status

  const list = useQuery({
    ...trpc.panel.submissions.list.queryOptions({ page, kind: search.kind, status, q: search.q }),
    placeholderData: keepPreviousData,
  })

  const update = (next: Partial<SubmissionsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: undefined, ...next }) })

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    update({ q: q || undefined })
  }

  // After paging, focus the list heading so keyboard and screen-reader users land on the new page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const goToPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next > 1 ? next : undefined }) }).then(() => headingRef.current?.focus())

  const data = list.data

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Zgłoszenia mieszkańców</h1>

      <section aria-label="Filtry" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <Field className="sm:w-48">
          <FieldLabel htmlFor="filter-kind">Rodzaj</FieldLabel>
          <NativeSelect
            id="filter-kind"
            className="w-full"
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
            className="w-full"
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

        <form role="search" onSubmit={onSearch} className="flex flex-1 flex-col gap-2 sm:min-w-64">
          <label htmlFor="filter-q" className="text-sm font-medium">
            Szukaj w zapytaniach
          </label>
          <div className="flex gap-2">
            <Input id="filter-q" name="q" type="search" defaultValue={search.q} key={search.q} />
            <Button type="submit" variant="outline">
              Szukaj
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="list-heading" className="flex flex-col gap-4">
        <h2 id="list-heading" ref={headingRef} tabIndex={-1} className="sr-only outline-none">
          Lista zgłoszeń, strona {page}
        </h2>

        <p role="status" className="text-sm text-muted-foreground">
          {list.isFetching && !data ? 'Wczytywanie…' : data ? `Znaleziono: ${data.total}` : ''}
        </p>

        {list.isError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>Nie udało się wczytać zgłoszeń.</AlertDescription>
          </Alert>
        )}

        {data && data.items.length === 0 && <p>Brak zgłoszeń dla wybranych filtrów.</p>}
        {data && data.items.length > 0 && <SubmissionsList items={data.items} onOpen={(id) => navigate({ search: (prev) => ({ ...prev, id }) })} />}

        {data && data.pageCount > 1 && (
          <nav aria-label="Strony" className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              Poprzednia
            </Button>
            <span>
              Strona {page} z {data.pageCount}
            </span>
            <Button
              variant="outline"
              disabled={page >= data.pageCount}
              onClick={() => goToPage(page + 1)}
            >
              Następna
            </Button>
          </nav>
        )}
      </section>

      <SubmissionDialog id={search.id} onClose={() => navigate({ search: (prev) => ({ ...prev, id: undefined }) })} />
    </div>
  )
}
