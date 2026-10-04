import type { FormEvent, ReactNode } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { cn } from 'cn'
import { PAGE_SIZES, type PageSize } from '@/components/list-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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

const STATUS_OPTIONS: { value: HandlingStatus | 'all'; label: string; dot?: string }[] = [
  { value: 'new', label: statusLabel.new, dot: 'bg-sky-500' },
  { value: 'in_progress', label: statusLabel.in_progress, dot: 'bg-amber-500' },
  { value: 'done', label: statusLabel.done, dot: 'bg-emerald-500' },
  { value: 'all', label: 'Wszystkie' },
]

/** Stan as a segmented switch: one click instead of a select, and the colours match the Stan tags in the list. */
export function StatusFilter({ value, onChange }: { value?: HandlingStatus | 'all'; onChange: (status: HandlingStatus | 'all') => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span id="filter-status" className="text-sm font-medium">
        Stan
      </span>
      <ToggleGroup
        aria-labelledby="filter-status"
        value={[value ?? 'new']}
        onValueChange={(next) => {
          const status = next[0]
          if (status === 'all' || isHandlingStatus(status)) onChange(status)
        }}
        spacing={0}
        className="flex-wrap rounded-xl border bg-background p-1 shadow-xs"
      >
        {STATUS_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="h-8 gap-2 rounded-lg! px-3 text-sm data-pressed:bg-primary-soft data-pressed:font-semibold data-pressed:text-primary-strong"
          >
            {option.dot && <span aria-hidden="true" className={cn('size-2 rounded-full', option.dot)} />}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/** The filters strip above a list. */
export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Filtry" className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:flex-wrap sm:items-end">
      {children}
    </section>
  )
}
