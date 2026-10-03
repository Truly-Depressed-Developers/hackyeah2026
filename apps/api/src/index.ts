import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { auth } from './auth.js'
import { mockCatalog, realCatalog } from './ai/catalog.js'
import { mockSearch } from './ai/mock.js'
import { realSearch } from './ai/search.js'
import { env } from './env.js'
import { appRouter } from './router.js'
import { createContext } from './trpc.js'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.use('/trpc/*', trpcServer({ router: appRouter, createContext }))

// Only search is exposed: the AI service also has admin endpoints (collections, documents) the browser must never reach.
app.post('/ai/search', (c) => (env.AI_URL ? realSearch(c) : mockSearch(c)))
app.get('/ai/catalog', (c) => (env.AI_URL ? realCatalog(c) : mockCatalog(c)))
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
