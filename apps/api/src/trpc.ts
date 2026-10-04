import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { assertFormAllowed, clientIp } from './analytics/rate-limit.js'
import { auth } from './auth.js'

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: req.headers })
  return { session, ip: clientIp(req.headers) }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Public writes from the resident app (Potrzeby, Pomysły): rate-limited per IP.
export const formProcedure = t.procedure.use(({ ctx, next }) => {
  assertFormAllowed(ctx.ip)
  return next()
})

// Every Panel administratora procedure goes through this: no session, no data.
export const panelProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { session: ctx.session } })
})
