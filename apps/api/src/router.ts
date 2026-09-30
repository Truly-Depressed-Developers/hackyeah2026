import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from './db/index.js'
import { decisions, type Decision } from './db/schema.js'
import { decideClient } from './decide/index.js'
import { publicProcedure, router } from './trpc.js'

// No tRPC transformer: send Dates as ISO strings so client types match the wire.
const toDto = (row: Decision) => ({ ...row, createdAt: row.createdAt.toISOString() })

export const appRouter = router({
  decisions: router({
    list: publicProcedure.query(async () => {
      const rows = await db.select().from(decisions).orderBy(desc(decisions.createdAt)).limit(50)
      return rows.map(toDto)
    }),

    create: publicProcedure
      .input(
        z.object({
          state: z.string().trim().min(1),
          question: z.string().trim().min(1),
          options: z.array(z.string().trim().min(1)).min(1),
        }),
      )
      .mutation(async ({ input }) => {
        const result = await decideClient.decide(input)
        const [row] = await db
          .insert(decisions)
          .values({
            input: input.state,
            question: input.question,
            answer: result.answer,
            confidence: result.confidence,
          })
          .returning()
        return toDto(row!)
      }),
  }),
})

export type AppRouter = typeof appRouter
