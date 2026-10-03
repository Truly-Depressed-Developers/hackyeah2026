import type { Context } from 'hono'
import { z } from 'zod'
import { env } from '../env.js'
import type { components } from './schema.js'
import type { components as vector } from './vector-api.js'

type Result = components['schemas']['Result']
type SearchResponse = components['schemas']['SearchResponse']
type QueryRequest = vector['schemas']['QueryRequest']
type QueryResponse = vector['schemas']['QueryResponse']
type QueryMatch = vector['schemas']['QueryMatch']

// Chroma distance (lower = closer), calibrated 2026-10-03 on gemini-embedding-2: good matches 0.41–0.47, off-topic ≥ 0.54.
const SOLUTION_MAX_DISTANCE = 0.47
const RELATED_MAX_DISTANCE = 0.53
// ~120 records in total: the distance threshold, not a count cap, limits the list.
const N_RESULTS = 30
const TIMEOUT_MS = 8_000

export const searchRequest = z.object({
  collection: z.string().trim().min(1).max(100).optional(),
  query: z.string().trim().min(1).max(500),
})

export async function realSearch(c: Context): Promise<Response> {
  const parsed = searchRequest.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid search request' }, 400)

  const body: QueryRequest = {
    query: parsed.data.query,
    n_results: N_RESULTS,
    collection_name: env.AI_COLLECTION,
    max_distance: RELATED_MAX_DISTANCE,
  }

  let response: Response
  try {
    response = await fetch(`${env.AI_URL}/api/query`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.AI_API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.error('AI service unreachable:', err)
    return c.json({ error: 'AI service unavailable' }, 502)
  }
  if (!response.ok) {
    console.error(`AI service responded ${response.status}: ${await response.text().catch(() => '')}`)
    return c.json({ error: 'AI service error' }, 502)
  }

  const data = (await response.json()) as QueryResponse
  const matches = data.results[0]?.matches ?? []
  return c.json(toSearchResponse(matches))
}

export function toSearchResponse(matches: QueryMatch[]): SearchResponse {
  const solutions: Result[] = []
  const related: Result[] = []
  for (const match of matches) {
    const distance = match.distance ?? Infinity
    const result = toResult(match)
    if (!result) continue
    if (distance <= SOLUTION_MAX_DISTANCE) solutions.push(result)
    else if (distance <= RELATED_MAX_DISTANCE) related.push(result)
  }
  return { solutions, related, noMatch: solutions.length === 0 && related.length === 0 }
}

function toResult(match: QueryMatch): Result | null {
  const meta = match.metadata ?? {}
  const text = (key: keyof typeof meta) => clean(meta[key])
  const sections = parseSections(match.document ?? '')

  const title = text('title') ?? sections['Tytuł innowacji']
  const summary = sections['Rozwiązanie'] ?? sections['Problem']
  if (!title || !summary) return null

  const problem = sections['Problem']
  const targetGroup = sections['Grupa docelowa']
  return {
    id: match.id,
    kind: 'innovation',
    title,
    summary: truncate(summary, 300),
    subtitle: subtitleFrom(sections['Opis'] ?? '', title),
    featured: isFeatured(sections['Opis'] ?? ''),
    category: text('category_name') ?? sections['Kategoria'],
    categorySlug: text('category_slug'),
    why: problem ? firstSentence(problem) : `Przeznaczone dla: ${lowerFirst(truncate(targetGroup ?? title, 200))}`,
    whyGenerated: false,
    source: { label: 'Biblioteka Innowacji Społecznych', url: text('source_url') },
    details: { problem, targetGroup, effectiveness: sections['Skuteczność'] },
    links: { video: text('youtube_video'), pdf: firstPdf(meta.details_pdf), download: text('file_zip') },
  }
}

// The AI service stores record fields as "Label: value" paragraphs in `document`.
export function parseSections(document: string) {
  const sections: Record<string, string> = {}
  for (const block of document.split(/\n\s*\n/)) {
    const match = block.match(/^([^:\n]{2,40}):\s*([\s\S]+)$/)
    const value = match && clean(match[2])
    if (match && value) sections[match[1]!.trim()] = value
  }
  return sections
}

// details_pdf arrives as a JSON-encoded array string, e.g. '["https://…pdf"]'.
export function firstPdf(value: unknown) {
  if (Array.isArray(value)) return clean(value[0])
  if (typeof value !== 'string') return undefined
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? clean(parsed[0]) : clean(value)
  } catch {
    return clean(value)
  }
}

export function clean(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.replace(/\s+/g, ' ').trim() : undefined
}

function firstSentence(value: string) {
  const end = value.search(/[.!?](\s|$)/)
  return end === -1 ? truncate(value, 200) : truncate(value.slice(0, end + 1), 200)
}

export function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max).replace(/\s+\S*$/, '')}…`
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1)
}

// "Opis" is scraped page text: "<Title> - <one-liner> INNOWACJA WYBRANA… dowiedz się więcej pobierz materiały…".
export function subtitleFrom(description: string, title: string) {
  const withoutTitle = description.replace(new RegExp(`^${escapeRegExp(title)}\\s*[-–—]\\s*`, 'i'), '')
  const text = withoutTitle.split(/\s*(?:innowacja wybrana|dowiedz się więcej|zobacz film|pobierz materiały|sprawdź zasady|otwórz w telefonie)/i)[0]?.trim()
  return text ? upperFirst(text) : undefined
}

export function isFeatured(description: string) {
  return /wybrana do upowszechniania/i.test(description)
}

export function upperFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
