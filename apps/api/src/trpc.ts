import { initTRPC, TRPCError } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { auth } from './auth.js'

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({ headers: req.headers })
  return { session }
}

const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create()

export const router = t.router
export const publicProcedure = t.procedure

// Every Panel administratora procedure goes through this: no session, no data.
export const panelProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { session: ctx.session } })
})
