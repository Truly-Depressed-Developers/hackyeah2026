import type { FormEvent } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { PAGE_SIZES, type PageSize } from '@/components/list-pagination'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { isHandlingStatus, statusLabel, type HandlingStatus } from './handling'

// URL state shared by the Panel administratora lists, so a view can be refreshed or shared with a colleague.

export const DEFAULT_PAGE_SIZE: PageSize = 20

export interface ListSearch {
  page?: number
  size?: PageSize
  /** No value means the default view: Nowe. "all" shows every Stan. */
  status?: HandlingStatus | 'all'
  q?: string
}

export function parseListSearch(search: Record<string, unknown>): ListSearch {
  const page = Number(search.page)
  const size = Number(search.size)
  const q = typeof search.q === 'string' ? search.q.trim() : ''
  return {
    page: Number.isInteger(page) && page > 1 ? page : undefined,
    size: PAGE_SIZES.includes(size as PageSize) && size !== DEFAULT_PAGE_SIZE ? (size as PageSize) : undefined,
    status: search.status === 'all' ? 'all' : isHandlingStatus(search.status) ? search.status : 'new',
    q: q || undefined,
  }
}

/** The values the list query needs, with URL defaults resolved. */
export function listQuery(search: ListSearch) {
  return {
    page: search.page ?? 1,
    pageSize: search.size ?? DEFAULT_PAGE_SIZE,
    status: search.status === 'all' ? undefined : search.status,
    q: search.q,
  }
}

export function TextSearch({ label, value, onSearch }: { label: string; value?: string; onSearch: (q?: string) => void }) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    onSearch(q || undefined)
  }

  return (
    <form role="search" aria-label={label} onSubmit={onSubmit} className="flex flex-1 flex-col gap-2 sm:min-w-64">
      <label htmlFor="filter-q" className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <Input id="filter-q" name="q" type="search" defaultValue={value} key={value} className="bg-background" />
        <Button type="submit">
          <IconSearch aria-hidden="true" data-icon="inline-start" />
          Szukaj
        </Button>
      </div>
    </form>
  )
}

export function StatusFilter({ value, onChange }: { value?: HandlingStatus | 'all'; onChange: (status: HandlingStatus | 'all') => void }) {
  return (
    <Field className="sm:w-48">
      <FieldLabel htmlFor="filter-status">Stan</FieldLabel>
      <NativeSelect
        id="filter-status"
        className="w-full bg-background"
        value={value ?? 'new'}
        onChange={(e) => onChange(isHandlingStatus(e.target.value) ? e.target.value : 'all')}
      >
        <NativeSelectOption value="all">Wszystkie</NativeSelectOption>
        {Object.entries(statusLabel).map(([status, label]) => (
          <NativeSelectOption key={status} value={status}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
