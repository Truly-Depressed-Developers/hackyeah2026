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

// Potrzeby and Pomysły (see CONTEXT.md). Both share the simple handling Stan for now.
export const handlingStatus = pgEnum('handling_status', ['new', 'in_progress', 'done'])
export const needKind = pgEnum('need_kind', ['gap', 'idea', 'contact_request'])

/** A Wynik the Mieszkaniec saw before giving up; a snapshot, so later knowledge-base edits don't rewrite history. */
export interface ShownResult {
  id: string
  title: string
  tier: 'solution' | 'related'
}

/** One answered step of the Pomysł form. New steps are new answers, not new columns. */
export interface IdeaAnswer {
  question: string
  answer: string
}

export const need = pgTable(
  'need',
  {
    id: uuid().primaryKey().defaultRandom(),
    kind: needKind().notNull(),
    // Not used for kind 'idea': that one is handled through its Pomysł.
    status: handlingStatus().notNull().default('new'),
    query: text().notNull(),
    noMatch: boolean('no_match').notNull(),
    shownResults: jsonb('shown_results').$type<ShownResult[]>().notNull().default([]),
    // Prośba o kontakt only.
    contact: text(),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('need_status_created_idx').on(t.status, t.createdAt), index('need_kind_idx').on(t.kind)],
)

export const idea = pgTable(
  'idea',
  {
    id: uuid().primaryKey().defaultRandom(),
    // The Potrzeba it came from; null when proposed without a search.
    needId: uuid('need_id')
      .unique()
      .references(() => need.id, { onDelete: 'set null' }),
    status: handlingStatus().notNull().default('new'),
    title: text().notNull(),
    answers: jsonb().$type<IdeaAnswer[]>().notNull().default([]),
    contact: text().notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index('idea_status_created_idx').on(t.status, t.createdAt)],
)

export type Need = typeof need.$inferSelect
export type Idea = typeof idea.$inferSelect
