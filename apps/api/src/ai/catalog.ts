import type { Context } from 'hono'
import { env } from '../env.js'
import { related, solutions } from './fixtures.js'
import type { components } from './schema.js'
import { clean, firstPdf, isFeatured, parseSections, subtitleFrom, truncate, upperFirst } from './search.js'
import type { components as vector } from './vector-api.js'

type CatalogItem = components['schemas']['CatalogItem']
type Innovation = components['schemas']['Innovation']
type GetDocumentsResponse = vector['schemas']['GetDocumentsResponse']

const CACHE_MS = 10 * 60_000
const TIMEOUT_MS = 10_000
const SOURCE_LABEL = 'Biblioteka Innowacji Społecznych'

let cache: { at: number; items: Innovation[] } | null = null

/** Drop the cached catalog so the next read shows edits from the Panel administratora right away. */
export function invalidateCatalog() {
  cache = null
}

export async function realCatalog(c: Context): Promise<Response> {
  const items = await loadInnovations()
  return items ? c.json({ items: items.map(toCatalogItem) }) : c.json({ error: 'AI service unavailable' }, 502)
}

export async function realInnovation(c: Context): Promise<Response> {
  const items = await loadInnovations()
  if (!items) return c.json({ error: 'AI service unavailable' }, 502)
  const item = items.find((innovation) => innovation.id === c.req.param('id'))
  return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
}

export function mockCatalog(c: Context): Response {
  return c.json({ items: mockInnovations().map(toCatalogItem) })
}

export function mockInnovation(c: Context): Response {
  const item = mockInnovations().find((innovation) => innovation.id === c.req.param('id'))
  return item ? c.json(item) : c.json({ error: 'Not found' }, 404)
}

async function loadInnovations() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items
  try {
    const url = new URL(`${env.AI_URL}/api/documents`)
    url.searchParams.set('limit', '1000')
    url.searchParams.set('collection_name', env.AI_COLLECTION)
    const response = await fetch(url, { headers: { 'x-api-key': env.AI_API_KEY }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) throw new Error(`AI service responded ${response.status}`)

    const { data } = (await response.json()) as GetDocumentsResponse
    const items = data.ids.flatMap((id, i) => toInnovation(id, data.metadatas?.[i], data.documents?.[i]) ?? [])
    cache = { at: Date.now(), items }
    return items
  } catch (err) {
    console.error('Catalog fetch failed:', err)
    return cache?.items ?? null
  }
}

function toInnovation(id: string, metadata: unknown, document: unknown): Innovation | null {
  const meta = (metadata ?? {}) as Record<string, unknown>
  const sections = parseSections(typeof document === 'string' ? document : '')
  const title = clean(meta.title) ?? sections['Tytuł innowacji']
  if (!title) return null
  const description = sections['Opis'] ?? ''

  return {
    id,
    title,
    subtitle: subtitleFrom(description, title),
    featured: isFeatured(description),
    category: clean(meta.category_name) ?? sections['Kategoria'],
    categorySlug: clean(meta.category_slug),
    solution: sections['Rozwiązanie'],
    problem: sections['Problem'],
    targetGroup: sections['Grupa docelowa'],
    beneficiaries: splitList(sections['Odbiorcy i instytucje']),
    effectiveness: sections['Skuteczność'],
    authors: env.AI_SHOW_AUTHORS ? splitAuthors(sections['Autorzy'] ?? clean(meta.authors)) : undefined,
    source: { label: SOURCE_LABEL, url: clean(meta.source_url) },
    links: { video: clean(meta.youtube_video), pdf: firstPdf(meta.details_pdf), download: clean(meta.file_zip) },
  }
}

function toCatalogItem(item: Innovation): CatalogItem {
  return {
    id: item.id,
    title: item.title,
    summary: truncate(item.solution ?? item.problem ?? item.subtitle ?? '', 160),
    subtitle: item.subtitle,
    featured: item.featured,
    hasVideo: Boolean(item.links?.video),
    category: item.category,
    categorySlug: item.categorySlug,
    source: item.source,
  }
}

function splitList(value: string | undefined) {
  return (value ?? '')
    .replace(/\.$/, '')
    .split(/[,;]\s+(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(upperFirst)
}

function splitAuthors(value: string | undefined) {
  if (!value) return []
  return /^\s*-\s/.test(value) ? value.split(/\s*-\s+/).map((name) => name.trim()).filter(Boolean) : [value.trim()]
}

function mockInnovations(): Innovation[] {
  return [...solutions, ...related].map((result) => ({
    id: result.id,
    title: result.title,
    subtitle: result.summary,
    featured: result.id === 'dla-seniorow__bawita',
    category: result.category,
    categorySlug: result.categorySlug,
    solution: result.summary,
    problem: result.details?.problem,
    targetGroup: result.details?.targetGroup,
    beneficiaries: [],
    effectiveness: result.details?.effectiveness,
    source: result.source,
    links: result.links,
  }))
}
