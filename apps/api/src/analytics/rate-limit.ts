import { TRPCError } from '@trpc/server'
import type { Context } from 'hono'

/** In-memory sliding window per key. One API instance, so memory is enough; a restart forgets the counts. */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>()

  return function allow(key: string, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(now)
    hits.set(key, recent)
    // Keep the map from growing with one-off visitors.
    if (hits.size > 10_000) {
      for (const [other, times] of hits) if (times.every((time) => now - time >= windowMs)) hits.delete(other)
    }
    return true
  }
}

/** The client IP behind Render's proxy (first x-forwarded-for entry), like better-auth uses for login limits. */
export function clientIp(headers: Headers, fallback = 'unknown') {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || fallback
}

export const ipFromContext = (c: Context) => clientIp(c.req.raw.headers)

// Public writes: event batches, and the forms that store Potrzeby and Pomysły.
export const eventsLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 })
export const formsLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 })

export function assertFormAllowed(ip: string) {
  if (!formsLimiter(ip)) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Za dużo zgłoszeń. Spróbuj za chwilę.' })
}
