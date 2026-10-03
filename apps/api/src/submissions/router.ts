import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { submission, type Submission } from '../db/schema.js'
import { panelProcedure, publicProcedure, router } from '../trpc.js'

const kindSchema = z.enum(['gap', 'idea', 'contact_request'])
const statusSchema = z.enum(['new', 'in_progress', 'done'])

const shownResultSchema = z.object({
  id: z.string().min(1).max(500),
  title: z.string().min(1).max(500),
  tier: z.enum(['solution', 'related']),
})

const searchContext = {
  query: z.string().trim().min(1).max(2000),
  shownResults: z.array(shownResultSchema).max(50).default([]),
}

const ideaSchema = z.object({
  title: z.string().trim().min(1).max(200),
  answers: z
    .array(z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(5000) }))
    .max(50),
})

const resident = {
  ...searchContext,
  // Upgrades this Luka instead of creating a second Zgłoszenie for the same Zapytanie.
  gapId: z.uuid().optional(),
  contact: z.string().trim().min(3).max(200),
  consentAt: z.coerce.date(),
}

const submitInput = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('idea'), ...resident, idea: ideaSchema }),
  z.object({ kind: z.literal('contact_request'), ...resident }),
])

// No tRPC transformer: send Dates as ISO strings so client types match the wire.
const toDto = (row: Submission) => ({
  ...row,
  consentAt: row.consentAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

/** Public: the resident app records Zgłoszenia. S-03 builds the forms on top of `submit`. */
export const submissionsRouter = router({
  // A Luka is a Brak odpowiedzi by definition, so there are no shown Wyniki to keep.
  recordGap: publicProcedure.input(z.object({ query: searchContext.query })).mutation(async ({ input }) => {
    const [row] = await db
      .insert(submission)
      .values({ kind: 'gap', query: input.query, noMatch: true })
      .returning({ id: submission.id })
    return row!
  }),

  submit: publicProcedure.input(submitInput).mutation(async ({ input }) => {
    const values = {
      kind: input.kind,
      query: input.query,
      noMatch: input.shownResults.length === 0,
      shownResults: input.shownResults,
      contact: input.contact,
      consentAt: input.consentAt,
      idea: input.kind === 'idea' ? input.idea : null,
    }
    if (input.gapId) {
      const [upgraded] = await db
        .update(submission)
        .set(values)
        .where(and(eq(submission.id, input.gapId), eq(submission.kind, 'gap')))
        .returning({ id: submission.id })
      if (upgraded) return upgraded
    }
    const [row] = await db.insert(submission).values(values).returning({ id: submission.id })
    return row!
  }),
})

const PAGE_SIZE = 20

/** Panel administratora: only a logged-in Pracownik ROPS reads Zgłoszenia (they hold contact data). */
export const panelSubmissionsRouter = router({
  list: panelProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        kind: kindSchema.optional(),
        status: statusSchema.optional(),
        q: z.string().trim().max(200).optional(),
      }),
    )
    .query(async ({ input }) => {
      const filters: SQL[] = []
      if (input.kind) filters.push(eq(submission.kind, input.kind))
      if (input.status) filters.push(eq(submission.status, input.status))
      if (input.q) filters.push(ilike(submission.query, `%${input.q.replace(/[\\%_]/g, '\\$&')}%`))
      const where = filters.length > 0 ? and(...filters) : undefined

      const [rows, [totals]] = await Promise.all([
        db
          .select()
          .from(submission)
          .where(where)
          .orderBy(desc(submission.createdAt))
          .limit(PAGE_SIZE)
          .offset((input.page - 1) * PAGE_SIZE),
        db.select({ total: count() }).from(submission).where(where),
      ])
      const total = totals?.total ?? 0
      return { items: rows.map(toDto), total, page: input.page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
    }),

  get: panelProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const [row] = await db.select().from(submission).where(eq(submission.id, input.id))
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
    return toDto(row)
  }),

  setStatus: panelProcedure
    .input(z.object({ id: z.uuid(), status: statusSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(submission)
        .set({ status: input.status })
        .where(eq(submission.id, input.id))
        .returning()
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return toDto(row)
    }),
})
