import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, getTableColumns, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { idea, need, type Idea, type Need } from '../db/schema.js'
import { contains, handlingStatusSchema, iso, isoOrNull, pageInput, pageResult } from '../panel/list.js'
import { panelProcedure, publicProcedure, router } from '../trpc.js'

export const shownResultSchema = z.object({
  id: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  tier: z.enum(['solution', 'related']),
})

/** What the resident app knows about the search a Potrzeba comes from. */
export const searchContext = {
  query: z.string().trim().min(1).max(2000),
  shownResults: z.array(shownResultSchema).max(50).default([]),
  // Upgrades this Luka instead of creating a second Potrzeba for the same Zapytanie.
  gapId: z.uuid().optional(),
}

export const contactSchema = {
  contact: z.string().trim().min(3).max(200),
  consentAt: z.coerce.date(),
}

type NeedValues = Pick<typeof need.$inferInsert, 'kind' | 'query' | 'noMatch' | 'shownResults' | 'contact' | 'consentAt'>

/** Turns the Luka `gapId` into this Potrzeba, or creates a new one. Returns its id. */
export async function saveNeed(gapId: string | undefined, values: NeedValues) {
  if (gapId) {
    const [upgraded] = await db
      .update(need)
      .set(values)
      .where(and(eq(need.id, gapId), eq(need.kind, 'gap')))
      .returning({ id: need.id })
    if (upgraded) return upgraded.id
  }
  const [row] = await db.insert(need).values(values).returning({ id: need.id })
  return row!.id
}

type NeedWithIdea = Need & { idea: Pick<Idea, 'id' | 'title' | 'status'> | null }

const toDto = (row: NeedWithIdea) => ({
  ...row,
  consentAt: isoOrNull(row.consentAt),
  createdAt: iso(row.createdAt),
  updatedAt: iso(row.updatedAt),
})

const withIdea = () =>
  db
    .select({ ...getTableColumns(need), ideaId: idea.id, ideaTitle: idea.title, ideaStatus: idea.status })
    .from(need)
    .leftJoin(idea, eq(idea.needId, need.id))

const nest = ({ ideaId, ideaTitle, ideaStatus, ...row }: Awaited<ReturnType<typeof withIdea>>[number]): NeedWithIdea => ({
  ...row,
  idea: ideaId && ideaTitle && ideaStatus ? { id: ideaId, title: ideaTitle, status: ideaStatus } : null,
})

/** Public: the resident app records Potrzeby. S-03 builds the screens on top of these. */
export const needsRouter = router({
  // A Luka is a Brak odpowiedzi by definition, so there are no shown Wyniki to keep.
  recordGap: publicProcedure.input(z.object({ query: searchContext.query })).mutation(async ({ input }) => {
    const [row] = await db.insert(need).values({ kind: 'gap', query: input.query, noMatch: true }).returning({ id: need.id })
    return row!
  }),

  requestContact: publicProcedure
    .input(z.object({ ...searchContext, ...contactSchema }))
    .mutation(async ({ input }) => {
      const id = await saveNeed(input.gapId, {
        kind: 'contact_request',
        query: input.query,
        noMatch: input.shownResults.length === 0,
        shownResults: input.shownResults,
        contact: input.contact,
        consentAt: input.consentAt,
      })
      return { id }
    }),
})

/** Panel administratora: only a logged-in Pracownik ROPS reads Potrzeby (they hold contact data). */
export const panelNeedsRouter = router({
  list: panelProcedure
    .input(z.object({ ...pageInput, kind: z.enum(['gap', 'idea', 'contact_request']).optional() }))
    .query(async ({ input }) => {
      const filters: SQL[] = []
      if (input.kind) filters.push(eq(need.kind, input.kind))
      // A Potrzeba that led to a Pomysł is handled there, so it filters by the Pomysł's Stan.
      if (input.status) filters.push(sql`coalesce(${idea.status}, ${need.status}) = ${input.status}`)
      if (input.q) filters.push(contains(need.query, input.q))
      const where = filters.length > 0 ? and(...filters) : undefined

      const [rows, [totals]] = await Promise.all([
        withIdea()
          .where(where)
          .orderBy(desc(need.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db.select({ total: count() }).from(need).leftJoin(idea, eq(idea.needId, need.id)).where(where),
      ])
      return pageResult(rows.map(nest).map(toDto), totals?.total ?? 0, input.page, input.pageSize)
    }),

  get: panelProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const [row] = await withIdea().where(eq(need.id, input.id))
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
    return toDto(nest(row))
  }),

  setStatus: panelProcedure
    .input(z.object({ id: z.uuid(), status: handlingStatusSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db.update(need).set({ status: input.status }).where(eq(need.id, input.id)).returning({ id: need.id })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return row
    }),
})
