import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { parseBatch } from './analytics/events.js'
import { ingest, MAX_BATCH_BYTES } from './analytics/ingest.js'
import { eventsLimiter, ipFromContext } from './analytics/rate-limit.js'
import { auth } from './auth.js'
import { mockCatalog, mockInnovation, realCatalog, realInnovation } from './ai/catalog.js'
import { mockSearch } from './ai/mock.js'
import { realSearch } from './ai/search.js'
import { env } from './env.js'
import { appRouter } from './router.js'
import { createContext } from './trpc.js'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.use('/trpc/*', trpcServer({ router: appRouter, createContext }))

// Analytics batches from the resident app. Plain Hono, not tRPC: navigator.sendBeacon posts text/plain without custom headers.
app.post('/api/events', async (c) => {
  if (!eventsLimiter(ipFromContext(c))) return c.body(null, 429)
  const text = await c.req.text()
  if (Buffer.byteLength(text) > MAX_BATCH_BYTES) return c.body(null, 413)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const batch = parseBatch(body)
  if (!batch.success) return c.json({ error: 'Invalid event batch' }, 400)
  await ingest(batch.data)
  return c.body(null, 204)
})

// Only search is exposed: the AI service also has admin endpoints (collections, documents) the browser must never reach.
app.post('/ai/search', (c) => (env.AI_URL ? realSearch(c) : mockSearch(c)))
app.get('/ai/catalog', (c) => (env.AI_URL ? realCatalog(c) : mockCatalog(c)))
app.get('/ai/catalog/:id', (c) => (env.AI_URL ? realInnovation(c) : mockInnovation(c)))
app.all('/ai/*', (c) => c.json({ error: 'Not found' }, 404))

const webDist = fileURLToPath(new URL('../../web/dist/', import.meta.url))
if (existsSync(webDist)) {
  app.use('*', serveStatic({ root: webDist }))
  app.get('*', serveStatic({ root: webDist, path: 'index.html' }))
}

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API running on http://localhost:${info.port} (AI: ${env.AI_URL || 'mock'})`)
})

process.on('SIGINT', () => {
  server.close()
  process.exit(0)
})
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
