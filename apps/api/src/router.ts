import { panelAnalyticsRouter } from './analytics/router.js'
import { ideasRouter, panelIdeasRouter } from './ideas/router.js'
import { panelInnovationsRouter } from './innovations/router.js'
import { needsRouter, panelNeedsRouter } from './needs/router.js'
import { kioskRouter } from './sms/router.js'
import { panelProcedure, router } from './trpc.js'

export const appRouter = router({
  // Public procedures the resident app calls.
  needs: needsRouter,
  ideas: ideasRouter,
  kiosk: kioskRouter,

  // Panel administratora. Every procedure under here is on panelProcedure.
  panel: router({
    me: panelProcedure.query(({ ctx }) => ({
      name: ctx.session.user.name,
      email: ctx.session.user.email,
    })),
    needs: panelNeedsRouter,
    ideas: panelIdeasRouter,
    innovations: panelInnovationsRouter,
    analytics: panelAnalyticsRouter,
  }),
})

export type AppRouter = typeof appRouter
