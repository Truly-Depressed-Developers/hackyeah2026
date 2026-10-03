import { router } from './trpc.js'

// App data procedures (operator panel, submissions) go here. AI calls bypass tRPC: see docs/adr/0001.
export const appRouter = router({})

export type AppRouter = typeof appRouter
