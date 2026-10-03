import { delay, http, HttpResponse } from 'msw'
import type { SearchResponse } from '@/lib/ai/client'
import { related, solutions } from './fixtures'

// Trigger words: "nic" → Brak odpowiedzi, "pokrewne" → only Rozwiązania pokrewne, "błąd" → HTTP 500.

export const handlers = [
  http.post('/ai/search', async ({ request }) => {
    const { query } = (await request.json()) as { query: string }
    const q = query.toLowerCase()
    await delay(1500)

    if (q.includes('błąd')) return new HttpResponse(null, { status: 500 })

    const body: SearchResponse = q.includes('nic')
      ? { solutions: [], related: [], noMatch: true }
      : q.includes('pokrewne')
        ? { solutions: [], related, noMatch: false }
        : { solutions, related, noMatch: false }
    return HttpResponse.json(body)
  }),
]
