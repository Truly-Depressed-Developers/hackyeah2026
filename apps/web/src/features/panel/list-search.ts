import { isHandlingStatus, type HandlingStatus } from './handling'

export const PAGE_SIZES = [10, 20, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

// URL state shared by the Panel administratora lists, so a view can be refreshed or shared with a colleague.
// No UI imports here: route validateSearch runs in the main bundle, so this file must stay tiny.

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
