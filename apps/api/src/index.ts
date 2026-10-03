import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { proxy } from 'hono/proxy'
import { auth } from './auth.js'
import { mockSearch } from './ai/mock.js'
import { env } from './env.js'
import { appRouter } from './router.js'
import { createContext } from './trpc.js'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true }))
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.use('/trpc/*', trpcServer({ router: appRouter, createContext }))

if (!env.AI_URL) app.post('/ai/search', mockSearch)

app.all('/ai/*', async (c) => {
  const url = new URL(c.req.url)
  const target = `${env.AI_URL}${url.pathname.slice('/ai'.length)}${url.search}`
  try {
    return await proxy(target, { ...c.req, headers: { ...c.req.header(), host: undefined } })
  } catch (err) {
    console.error(`AI service unreachable at ${target}:`, err)
    return c.json({ error: 'AI service unavailable' }, 502)
  }
})

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
