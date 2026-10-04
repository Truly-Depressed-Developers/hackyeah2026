import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { components, paths } from './schema'

export type SearchResponse = components['schemas']['SearchResponse']
export type Result = components['schemas']['Result']
export type ResultKind = components['schemas']['ResultKind']
export type CatalogItem = components['schemas']['CatalogItem']
export type Innovation = components['schemas']['Innovation']

export const SEARCH_COLLECTION = 'knowledge'

const TIMEOUT_MS = 10_000

// Plain AbortController instead of AbortSignal.any/timeout: those are missing before Safari 17.4 (older iPads),
// where they throw before the request is sent.
function fetchWithTimeout(request: Request) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  if (request.signal.aborted) controller.abort()
  else request.signal.addEventListener('abort', () => controller.abort(), { once: true })
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

const fetchClient = createFetchClient<paths>({
  baseUrl: '/ai',
  fetch: fetchWithTimeout,
})

export const $ai = createClient(fetchClient)
