import { serve } from '@hono/node-server'
import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { env } from './env.js'
import { appRouter } from './router.js'

const app = new Hono()

app.get('/health', (c) => c.json({ ok: true, decideMode: env.DECIDE_MODE }))
app.use('/trpc/*', trpcServer({ router: appRouter }))

const server = serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`API running on http://localhost:${info.port} (DECIDE_MODE=${env.DECIDE_MODE})`)
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
