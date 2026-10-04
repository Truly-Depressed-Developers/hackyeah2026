import { z } from 'zod'
import { panelProcedure, router } from '../trpc.js'
import { rangeFor } from './metrics.js'
import * as q from './queries.js'
import { ensureFreshRollups } from './rollup.js'

export const RANGES = [7, 30, 90] as const

// Staff only: dashboard data is for a logged-in Pracownik ROPS.
const rangeProcedure = panelProcedure
  .input(z.object({ days: z.union(RANGES.map((n) => z.literal(n))) }))
  .use(async ({ input, next }) => {
    const refreshedAt = await ensureFreshRollups()
    return next({ ctx: { range: rangeFor((input as { days: number }).days, new Date()), refreshedAt } })
  })

export const panelAnalyticsRouter = router({
  overview: rangeProcedure.query(async ({ ctx }) => ({
    range: ctx.range,
    refreshedAt: ctx.refreshedAt.toISOString(),
    kpis: await q.overview(ctx.range),
  })),
  searchesOverTime: rangeProcedure.query(({ ctx }) => q.searchesOverTime(ctx.range)),
  funnel: rangeProcedure.query(({ ctx }) => q.funnel(ctx.range)),
  topQueries: rangeProcedure.query(({ ctx }) => q.topQueries(ctx.range)),
  topGaps: rangeProcedure.query(({ ctx }) => q.topGaps(ctx.range)),
  topInnovations: rangeProcedure.query(({ ctx }) => q.topInnovations(ctx.range)),
  actionsBreakdown: rangeProcedure.query(({ ctx }) => q.actionsBreakdown(ctx.range)),
  hourHeatmap: rangeProcedure.query(({ ctx }) => q.hourHeatmap(ctx.range)),
  categories: rangeProcedure.query(({ ctx }) => q.categories(ctx.range)),
  voiceAndAccessibility: rangeProcedure.query(({ ctx }) => q.voiceAndAccessibility(ctx.range)),
})
