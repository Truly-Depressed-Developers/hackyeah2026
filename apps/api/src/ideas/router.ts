import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, getTableColumns, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { idea, need, type Idea } from '../db/schema.js'
import { contactSchema, saveNeed, searchContext } from '../needs/router.js'
import { contains, handlingStatusSchema, iso, pageInput, pageResult } from '../panel/list.js'
import { panelProcedure, publicProcedure, router } from '../trpc.js'

const ideaContent = {
  title: z.string().trim().min(1).max(300),
  answers: z
    .array(z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(5000) }))
    .max(50),
  ...contactSchema,
}

type IdeaWithNeed = Idea & { need: { id: string; query: string } | null }

const toDto = (row: IdeaWithNeed) => ({
  ...row,
  consentAt: iso(row.consentAt),
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
})

const withNeed = () =>
  db
    .select({ ...getTableColumns(idea), needQuery: need.query })
    .from(idea)
    .leftJoin(need, eq(need.id, idea.needId))

const nest = ({ needQuery, ...row }: Awaited<ReturnType<typeof withNeed>>[number]): IdeaWithNeed => ({
  ...row,
  need: row.needId && needQuery ? { id: row.needId, query: needQuery } : null,
})

/** Public: the resident app submits a Pomysł. The step-by-step form (S-03) sends it whole at the end. */
export const ideasRouter = router({
  submit: publicProcedure
    .input(z.object({ ...ideaContent, search: z.object(searchContext).optional() }))
    .mutation(async ({ input }) => {
      // From a search: the Potrzeba becomes kind 'idea' and points here. Without one, the Pomysł stands alone.
      const needId = input.search
        ? await saveNeed(input.search.gapId, {
            kind: 'idea',
            query: input.search.query,
            noMatch: input.search.shownResults.length === 0,
            shownResults: input.search.shownResults,
            contact: null,
            consentAt: null,
          })
        : null
      const [row] = await db
        .insert(idea)
        .values({ needId, title: input.title, answers: input.answers, contact: input.contact, consentAt: input.consentAt })
        .returning({ id: idea.id })
      return row!
    }),
})

/** Panel administratora: Pomysły are managed separately from Potrzeby. */
export const panelIdeasRouter = router({
  list: panelProcedure.input(z.object(pageInput)).query(async ({ input }) => {
    const filters: SQL[] = []
    if (input.status) filters.push(eq(idea.status, input.status))
    if (input.q) filters.push(contains(idea.title, input.q))
    const where = filters.length > 0 ? and(...filters) : undefined

    const [rows, [totals]] = await Promise.all([
      withNeed()
        .where(where)
        .orderBy(desc(idea.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      db.select({ total: count() }).from(idea).where(where),
    ])
    return pageResult(rows.map(nest).map(toDto), totals?.total ?? 0, input.page, input.pageSize)
  }),

  get: panelProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const [row] = await withNeed().where(eq(idea.id, input.id))
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
    return toDto(nest(row))
  }),

  setStatus: panelProcedure
    .input(z.object({ id: z.uuid(), status: handlingStatusSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db.update(idea).set({ status: input.status }).where(eq(idea.id, input.id)).returning({ id: idea.id })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return row
    }),
})
