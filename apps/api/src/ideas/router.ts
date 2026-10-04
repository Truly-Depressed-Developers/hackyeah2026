import { TRPCError } from '@trpc/server'
import { and, count, desc, eq, getTableColumns, inArray, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { idea, need, testSignup, type Idea, type IdeaAnswer } from '../db/schema.js'
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

/**
 * The only answers that may leave the Panel administratora. The Pomysł form also stores the author's
 * „Imię", which is personal data and stays here. An allowlist rather than a denylist: a step added
 * later is invisible publicly until someone decides it is safe.
 *
 * The texts mirror QUESTIONS in apps/web/src/features/idea/idea-form.ts - zod input schemas live
 * server-side and are not importable by the client, so this duplication is the pattern in this repo
 * (same as HandlingStatus in panel/list.ts).
 */
const PUBLIC_QUESTIONS = {
  essence: 'Na czym polega Twój pomysł?',
  groups: 'Komu ma pomóc Twój pomysł?',
  stage: 'Na jakim etapie jest Twój pomysł?',
} as const

const publicAnswers = (answers: IdeaAnswer[]) =>
  answers.filter((item) => Object.values(PUBLIC_QUESTIONS).some((question) => question === item.question))

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

/** How many Testerzy signed up for each of the given Pomysły. */
async function signupCounts(ideaIds: string[]) {
  if (ideaIds.length === 0) return new Map<string, number>()
  const rows = await db
    .select({ ideaId: testSignup.ideaId, total: count() })
    .from(testSignup)
    .where(inArray(testSignup.ideaId, ideaIds))
    .groupBy(testSignup.ideaId)
  return new Map(rows.map((row) => [row.ideaId, row.total]))
}

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

  /** Pomysły a Pracownik ROPS opened for testing. Never selects `contact` - see PUBLIC_QUESTIONS. */
  openForTesting: publicProcedure.query(async () => {
    const rows = await db
      .select({ id: idea.id, title: idea.title, answers: idea.answers, createdAt: idea.createdAt })
      .from(idea)
      .where(eq(idea.openForTesting, true))
      .orderBy(desc(idea.createdAt))
      // No paging in the MVP; a kiosk list this long already needs a different screen.
      .limit(60)

    const counts = await signupCounts(rows.map((row) => row.id))
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      answers: publicAnswers(row.answers),
      createdAt: iso(row.createdAt),
      signupCount: counts.get(row.id) ?? 0,
    }))
  }),

  /** Public: a Mieszkaniec leaves their contact to test a Pomysł. ROPS writes to them by hand. */
  signUpForTest: publicProcedure
    .input(z.object({ ideaId: z.uuid(), name: z.string().trim().min(1).max(100), ...contactSchema }))
    .mutation(async ({ input }) => {
      // Guessing a uuid must not get anyone onto a Pomysł that ROPS has not opened for testing.
      const [open] = await db
        .select({ id: idea.id })
        .from(idea)
        .where(and(eq(idea.id, input.ideaId), eq(idea.openForTesting, true)))
      if (!open) throw new TRPCError({ code: 'NOT_FOUND' })

      const [row] = await db
        .insert(testSignup)
        .values({ ideaId: input.ideaId, name: input.name, contact: input.contact, consentAt: input.consentAt })
        .onConflictDoNothing()
        .returning({ id: testSignup.id })

      // Nothing inserted means this contact already had a Zapis - say so rather than fake a new one.
      return { alreadySignedUp: !row }
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
    const counts = await signupCounts(rows.map((row) => row.id))
    const items = rows.map(nest).map(toDto).map((row) => ({ ...row, testerCount: counts.get(row.id) ?? 0 }))
    return pageResult(items, totals?.total ?? 0, input.page, input.pageSize)
  }),

  get: panelProcedure.input(z.object({ id: z.uuid() })).query(async ({ input }) => {
    const [row] = await withNeed().where(eq(idea.id, input.id))
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' })

    const testers = await db.select().from(testSignup).where(eq(testSignup.ideaId, input.id)).orderBy(desc(testSignup.createdAt))
    return {
      ...toDto(nest(row)),
      testers: testers.map((tester) => ({
        id: tester.id,
        name: tester.name,
        contact: tester.contact,
        consentAt: iso(tester.consentAt),
        createdAt: iso(tester.createdAt),
      })),
    }
  }),

  setStatus: panelProcedure
    .input(z.object({ id: z.uuid(), status: handlingStatusSchema }))
    .mutation(async ({ input }) => {
      const [row] = await db.update(idea).set({ status: input.status }).where(eq(idea.id, input.id)).returning({ id: idea.id })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return row
    }),

  /** Opening a Pomysł for testing is what makes it public on /testy, so only a Pracownik ROPS may do it. */
  setOpenForTesting: panelProcedure
    .input(z.object({ id: z.uuid(), openForTesting: z.boolean() }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(idea)
        .set({ openForTesting: input.openForTesting })
        .where(eq(idea.id, input.id))
        .returning({ id: idea.id })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return row
    }),
})
