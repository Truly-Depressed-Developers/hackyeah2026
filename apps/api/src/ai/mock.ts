import type { Context } from 'hono'
import { related, solutions } from './fixtures.js'
import type { components } from './schema.js'

type SearchRequest = components['schemas']['SearchRequest']
type SearchResponse = components['schemas']['SearchResponse']

// Trigger words: "nic" → Brak odpowiedzi, "pokrewne" → only Rozwiązania pokrewne, "błąd" → HTTP 500.
export async function mockSearch(c: Context) {
  const { query } = await c.req.json<SearchRequest>()
  const q = query.toLowerCase()
  await new Promise((resolve) => setTimeout(resolve, 1500))

  if (q.includes('błąd')) return c.json({ error: 'Mock AI failure' }, 500)

  const body: SearchResponse = q.includes('nic')
    ? { solutions: [], related: [], noMatch: true }
    : q.includes('pokrewne')
      ? { solutions: [], related, noMatch: false }
      : { solutions, related, noMatch: false }
  return c.json(body)
}
