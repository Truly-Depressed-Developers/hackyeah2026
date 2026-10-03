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

// Chroma distance: lower = closer. Calibrate on real queries.
const SOLUTION_MAX_DISTANCE = 0.35
const RELATED_MAX_DISTANCE = 0.5
const N_RESULTS = 10
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
    collection_name: env.AI_COLLECTION || parsed.data.collection,
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
  const text = (key: string) => {
    const value = meta[key]
    return typeof value === 'string' && value.trim() ? value.replace(/\s+/g, ' ').trim() : undefined
  }
  const title = text('title')
  const summary = text('solution') ?? text('problem') ?? match.document?.slice(0, 300)
  if (!title || !summary) return null

  const pdf = text('details_pdf') ?? (Array.isArray(meta.details_pdf) ? String(meta.details_pdf[0] ?? '') || undefined : undefined)
  return {
    id: match.id,
    kind: 'innovation',
    title,
    summary,
    category: text('category_name'),
    why: matchReason(text('target_group'), text('problem')),
    source: { label: 'Biblioteka Innowacji Społecznych', url: text('source_url') },
    details: { problem: text('problem'), targetGroup: text('target_group'), effectiveness: text('effectiveness') },
    links: { video: text('youtube_video'), pdf, download: text('file_zip') },
  }
}

function matchReason(targetGroup?: string, problem?: string) {
  if (targetGroup) return `Przeznaczone dla: ${targetGroup}`
  if (problem) return problem
  return 'Opis tego rozwiązania jest bliski Twojemu problemowi.'
}
