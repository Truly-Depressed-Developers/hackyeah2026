import { boolean, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// better-auth core tables. Every user is a Pracownik ROPS with access to the Panel administratora.
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const user = pgTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text(),
  ...timestamps,
})

export const session = pgTable(
  'session',
  {
    id: text().primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...timestamps,
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

// Zgłoszenia (see CONTEXT.md): what the Panel administratora lists when a Mieszkaniec found no help.
export const submissionKind = pgEnum('submission_kind', ['gap', 'idea', 'contact_request'])
export const submissionStatus = pgEnum('submission_status', ['new', 'in_progress', 'done'])

/** A Wynik the Mieszkaniec saw before giving up; a snapshot, so later knowledge-base edits don't rewrite history. */
export interface ShownResult {
  id: string
  title: string
  tier: 'solution' | 'related'
}

/** Pomysł content. The step-by-step form sends it whole at the end; new steps are new answers, not new columns. */
export interface IdeaContent {
  title: string
  answers: { question: string; answer: string }[]
}

export const submission = pgTable(
  'submission',
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: submissionKind().notNull(),
    status: submissionStatus().notNull().default('new'),
    query: text().notNull(),
    noMatch: boolean('no_match').notNull(),
    shownResults: jsonb('shown_results').$type<ShownResult[]>().notNull().default([]),
    // Pomysł and Prośba o kontakt only; a Luka has neither.
    contact: text(),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    idea: jsonb().$type<IdeaContent>(),
    ...timestamps,
  },
  (t) => [index('submission_status_created_idx').on(t.status, t.createdAt), index('submission_kind_idx').on(t.kind)],
)

export type Submission = typeof submission.$inferSelect
