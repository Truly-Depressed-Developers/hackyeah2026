import type { Context } from 'hono'
import { env } from '../env.js'
import { related, solutions } from './fixtures.js'
import type { components } from './schema.js'
import { clean, parseSections, truncate } from './search.js'
import type { components as vector } from './vector-api.js'

type CatalogItem = components['schemas']['CatalogItem']
type GetDocumentsResponse = vector['schemas']['GetDocumentsResponse']

const CACHE_MS = 10 * 60_000
const TIMEOUT_MS = 10_000

let cache: { at: number; items: CatalogItem[] } | null = null

export async function realCatalog(c: Context): Promise<Response> {
  if (cache && Date.now() - cache.at < CACHE_MS) return c.json({ items: cache.items })

  try {
    const url = new URL(`${env.AI_URL}/api/documents`)
    url.searchParams.set('limit', '1000')
    if (env.AI_COLLECTION) url.searchParams.set('collection_name', env.AI_COLLECTION)
    const response = await fetch(url, { headers: { 'x-api-key': env.AI_API_KEY }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) throw new Error(`AI service responded ${response.status}`)

    const { data } = (await response.json()) as GetDocumentsResponse
    const items = data.ids.flatMap((id, i) => toCatalogItem(id, data.metadatas?.[i], data.documents?.[i]) ?? [])
    cache = { at: Date.now(), items }
    return c.json({ items })
  } catch (err) {
    console.error('Catalog fetch failed:', err)
    if (cache) return c.json({ items: cache.items })
    return c.json({ error: 'AI service unavailable' }, 502)
  }
}

export function mockCatalog(c: Context): Response {
  const items: CatalogItem[] = [...solutions, ...related].map(({ id, title, summary, category, categorySlug, source }) => ({
    id,
    title,
    summary,
    category,
    categorySlug,
    source,
  }))
  return c.json({ items })
}

function toCatalogItem(id: string, metadata: unknown, document: unknown): CatalogItem | null {
  const meta = (metadata ?? {}) as Record<string, unknown>
  const sections = parseSections(typeof document === 'string' ? document : '')
  const title = clean(meta.title) ?? sections['Tytuł innowacji']
  const summary = sections['Rozwiązanie'] ?? sections['Problem']
  if (!title || !summary) return null
  return {
    id,
    title,
    summary: truncate(summary, 160),
    category: clean(meta.category_name) ?? sections['Kategoria'],
    categorySlug: clean(meta.category_slug),
    source: { label: 'Biblioteka Innowacji Społecznych', url: clean(meta.source_url) },
  }
}
