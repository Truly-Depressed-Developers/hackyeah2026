import { TRPCError } from '@trpc/server'
import { env } from '../env.js'
import type { components } from '../ai/vector-api.js'

// The AI service's document API, used only from the server: the key never reaches the browser (ADR-0001).

type GetDocumentsResponse = components['schemas']['GetDocumentsResponse']
type DocumentActionResponse = components['schemas']['DocumentActionResponse']
export type RopsMetadata = components['schemas']['ROPSMetadata']

export interface StoredDocument {
  id: string
  document: string
  metadata: RopsMetadata
}

const TIMEOUT_MS = 30_000

async function call<T>(method: string, path: string, init: { query?: Record<string, string>; body?: object } = {}): Promise<T> {
  if (!env.AI_URL) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Serwis AI nie jest skonfigurowany (AI_URL).' })
  }
  const url = new URL(`${env.AI_URL}${path}`)
  for (const [k, v] of Object.entries({ collection_name: env.AI_COLLECTION, ...init.query })) url.searchParams.set(k, v)

  const response = await fetch(url, {
    method,
    headers: { 'x-api-key': env.AI_API_KEY, ...(init.body && { 'content-type': 'application/json' }) },
    body: init.body && JSON.stringify({ collection_name: env.AI_COLLECTION, ...init.body }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((cause: unknown) => {
    throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Serwis AI nie odpowiada.', cause })
  })
  if (!response.ok) {
    console.error(`AI service ${method} ${path} responded ${response.status}:`, await response.text())
    throw new TRPCError({ code: 'BAD_GATEWAY', message: `Serwis AI odrzucił żądanie (${response.status}).` })
  }
  return (await response.json()) as T
}

function rows({ data }: GetDocumentsResponse): StoredDocument[] {
  return data.ids.map((id, i) => ({
    id,
    document: typeof data.documents?.[i] === 'string' ? data.documents[i] : '',
    metadata: (data.metadatas?.[i] ?? {}) as RopsMetadata,
  }))
}

// Filters and paging in the panel re-read the whole collection, so keep it briefly; every write below clears it.
const LIST_CACHE_MS = 30_000
let listCache: { at: number; docs: StoredDocument[] } | null = null

export async function listDocuments() {
  if (listCache && Date.now() - listCache.at < LIST_CACHE_MS) return listCache.docs
  const docs = rows(await call<GetDocumentsResponse>('GET', '/api/documents', { query: { limit: '1000' } }))
  listCache = { at: Date.now(), docs }
  return docs
}

export async function getDocument(id: string) {
  return rows(await call<GetDocumentsResponse>('GET', '/api/documents', { query: { ids: id } }))[0] ?? null
}

/** The service assigns the id. */
export async function addDocument(document: string, metadata: RopsMetadata) {
  const result = await call<DocumentActionResponse>('POST', '/api/documents', { body: { documents: [document], metadatas: [metadata] } })
  listCache = null
  const id = result.ids[0]
  if (!id) throw new TRPCError({ code: 'BAD_GATEWAY', message: 'Serwis AI nie zwrócił identyfikatora.' })
  return id
}

export async function updateDocument(id: string, document: string, metadata: RopsMetadata) {
  await call<DocumentActionResponse>('PUT', '/api/documents', { body: { ids: [id], documents: [document], metadatas: [metadata] } })
  listCache = null
}

export async function deleteDocument(id: string) {
  await call<DocumentActionResponse>('DELETE', '/api/documents', { body: { ids: [id] } })
  listCache = null
}
