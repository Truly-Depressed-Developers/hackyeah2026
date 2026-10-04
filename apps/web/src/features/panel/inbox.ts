import { trpc } from '@/lib/trpc'

// What waits for a Pracownik ROPS: the newest Potrzeby and Pomysły in Stan "Nowe".
// The sidebar counters and the dashboard share these exact queries, so they cost one request each,
// and the lists' status changes refresh them (they invalidate every `list` query).

const NEW_PAGE = { page: 1, pageSize: 10, status: 'new' } as const
const REFRESH_MS = 60_000

export const newNeedsQuery = () => ({ ...trpc.panel.needs.list.queryOptions(NEW_PAGE), refetchInterval: REFRESH_MS })
export const newIdeasQuery = () => ({ ...trpc.panel.ideas.list.queryOptions(NEW_PAGE), refetchInterval: REFRESH_MS })
