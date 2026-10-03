import { panelProcedure, router } from './trpc.js'

export const appRouter = router({
  // Panel administratora. S-07/S-08 add their procedures here, all on panelProcedure.
  panel: router({
    me: panelProcedure.query(({ ctx }) => ({
      name: ctx.session.user.name,
      email: ctx.session.user.email,
    })),
  }),
})

export type AppRouter = typeof appRouter
