import { doublePrecision, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const decisions = pgTable('decisions', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  input: text().notNull(),
  question: text().notNull(),
  answer: text().notNull(),
  confidence: doublePrecision().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Decision = typeof decisions.$inferSelect
