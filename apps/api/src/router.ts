import { panelSubmissionsRouter, submissionsRouter } from './submissions/router.js'
import { panelProcedure, router } from './trpc.js'

export const appRouter = router({
  // Public procedures the resident app calls.
  submissions: submissionsRouter,

  // Panel administratora. Every procedure under here is on panelProcedure.
  panel: router({
    me: panelProcedure.query(({ ctx }) => ({
      name: ctx.session.user.name,
      email: ctx.session.user.email,
    })),
    submissions: panelSubmissionsRouter,
  }),
})

export type AppRouter = typeof appRouter
