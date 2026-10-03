import { $ai } from '@/lib/ai/client'
import { TileBrowser } from './tile-browser'

export function KnowledgeBase() {
  const catalog = $ai.useQuery('get', '/catalog', {}, { staleTime: 10 * 60_000, retry: false })

  return (
    <TileBrowser
      title="Baza wiedzy"
      items={catalog.data?.items ?? []}
      state={catalog.isPending ? 'pending' : catalog.isError ? 'error' : 'success'}
      errorText="Nie udało się wczytać bazy wiedzy."
      onRetry={() => catalog.refetch()}
      interleave
    />
  )
}
