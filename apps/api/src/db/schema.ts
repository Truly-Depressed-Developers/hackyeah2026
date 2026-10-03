import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

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
    // The Wyszukiwanie it ended. No foreign key: the Potrzeba can reach the API before the beacon that creates the search row.
    searchId: uuid('search_id'),
    ...timestamps,
  },
  (t) => [
    index('need_status_created_idx').on(t.status, t.createdAt),
    index('need_kind_idx').on(t.kind),
    index('need_search_id_idx').on(t.searchId),
  ],
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

// Analytics (HAC-18, ADR-0002). Anonymous: a Wizyta is a random id from the browser, nothing identifies a person.
export const visitMode = pgEnum('visit_mode', ['web', 'kiosk'])
export const searchInputMode = pgEnum('search_input_mode', ['text', 'voice'])

/** A Wynik as shown for a Wyszukiwanie, with its place on the screen. */
export interface SearchShownResult extends ShownResult {
  position: number
  category?: string
}

// One Wizyta. Created on its first event batch; the id comes from the browser.
export const visit = pgTable(
  'visit',
  {
    id: uuid().primaryKey(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    mode: visitMode().notNull().default('web'),
    // 'mobile' | 'tablet' | 'desktop'
    screen: text(),
    // 'search' | 'catalog' | 'innovation' | 'idea' | 'other'
    entry: text(),
  },
  (t) => [index('visit_started_idx').on(t.startedAt)],
)

// One Wyszukiwanie. The id comes from the browser at submit time, so later events link without a round trip.
export const search = pgTable(
  'search',
  {
    id: uuid().primaryKey(),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => visit.id, { onDelete: 'cascade' }),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    // Masked before storage (maskPii).
    query: text().notNull(),
    queryNormalized: text('query_normalized').notNull(),
    inputMode: searchInputMode('input_mode').notNull().default('text'),
    // Filled by results_shown; null while the Wyniki are still loading or if the Mieszkaniec left first.
    resultCount: integer('result_count'),
    solutionCount: integer('solution_count'),
    relatedCount: integer('related_count'),
    noMatch: boolean('no_match'),
    latencyMs: integer('latency_ms'),
    error: boolean().notNull().default(false),
    shownResults: jsonb('shown_results').$type<SearchShownResult[]>().notNull().default([]),
  },
  (t) => [
    index('search_occurred_idx').on(t.occurredAt),
    index('search_visit_idx').on(t.visitId),
    index('search_query_normalized_idx').on(t.queryNormalized),
  ],
)

// Every other analytics event, append-only.
export const analyticsEvent = pgTable(
  'analytics_event',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    visitId: uuid('visit_id').notNull(),
    // No foreign key: beacons from one Wizyta may arrive out of order.
    searchId: uuid('search_id'),
    type: text().notNull(),
    // Client time, clamped to server time ± 5 min.
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    innovationId: text('innovation_id'),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    index('analytics_event_type_occurred_idx').on(t.type, t.occurredAt),
    index('analytics_event_search_idx').on(t.searchId),
    index('analytics_event_visit_idx').on(t.visitId),
    index('analytics_event_occurred_brin').using('brin', t.occurredAt),
  ],
)

// Daily aggregates the Statystyki page reads for long ranges. key is '' for totals.
export const analyticsDaily = pgTable(
  'analytics_daily',
  {
    day: date({ mode: 'string' }).notNull(),
    metric: text().notNull(),
    key: text().notNull().default(''),
    value: numeric({ mode: 'number' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.metric, t.key] })],
)

export type Need = typeof need.$inferSelect
export type Idea = typeof idea.$inferSelect
