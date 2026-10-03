import type { Context } from 'hono'
import { related, solutions } from './fixtures.js'
import type { components } from './schema.js'
import { searchRequest } from './search.js'

type SearchResponse = components['schemas']['SearchResponse']

// Trigger words: "nic" → Brak odpowiedzi, "pokrewne" → only Rozwiązania pokrewne, "błąd" → HTTP 500.
export async function mockSearch(c: Context): Promise<Response> {
  const parsed = searchRequest.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid search request' }, 400)
  const q = parsed.data.query.toLowerCase()
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (q.includes('błąd')) return c.json({ error: 'Mock AI failure' }, 500)

  const body: SearchResponse = q.includes('nic')
    ? { solutions: [], related: [], noMatch: true }
    : q.includes('pokrewne')
      ? { solutions: [], related, noMatch: false }
      : { solutions, related, noMatch: false }
  return c.json(body)
}
