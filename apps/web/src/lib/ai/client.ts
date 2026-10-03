import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import type { components, paths } from './schema'

export type SearchResponse = components['schemas']['SearchResponse']
export type Result = components['schemas']['Result']
export type ResultKind = components['schemas']['ResultKind']
export type CatalogItem = components['schemas']['CatalogItem']

export const SEARCH_COLLECTION = 'knowledge'

const TIMEOUT_MS = 10_000

const fetchClient = createFetchClient<paths>({
  baseUrl: '/ai',
  fetch: (request) => fetch(request, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT_MS)]) }),
})

export const $ai = createClient(fetchClient)
