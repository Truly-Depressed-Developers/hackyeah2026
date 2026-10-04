import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { analyticsEvent, search, visit } from '../db/schema.js'
import { clampTime, type AnalyticsEvent, type Batch } from './events.js'
import { maskPii } from './mask.js'
import { normalizeQuery } from './normalize.js'

export const MAX_BATCH_BYTES = 32 * 1024

type EventRow = typeof analyticsEvent.$inferInsert

/** Stores one batch from the resident app: the Wizyta, its Wyszukiwania and every event. */
export async function ingest(batch: Batch, now = new Date()) {
  const events = batch.events.map((event) => ({ event, at: clampTime(event.at, now) }))
  const first = events.reduce((min, { at }) => (at < min ? at : min), events[0]!.at)
  const last = events.reduce((max, { at }) => (at > max ? at : max), events[0]!.at)
  const started = events.find(({ event }) => event.type === 'visit_started')?.event
  const ended = events.find(({ event }) => event.type === 'visit_ended')

  await db.transaction(async (tx) => {
    await tx
      .insert(visit)
      .values({
        id: batch.visitId,
        startedAt: first,
        lastSeenAt: last,
        ...(started?.type === 'visit_started' && { mode: started.mode, screen: started.screen, entry: started.entry }),
      })
      .onConflictDoUpdate({
        target: visit.id,
        set: {
          startedAt: sql`least(${visit.startedAt}, excluded.started_at)`,
          lastSeenAt: sql`greatest(${visit.lastSeenAt}, excluded.last_seen_at)`,
          ...(started && { mode: sql`excluded.mode`, screen: sql`excluded.screen`, entry: sql`excluded.entry` }),
        },
      })

    if (ended?.event.type === 'visit_ended') {
      await tx.update(visit).set({ endedAt: ended.at, durationMs: ended.event.durationMs }).where(eq(visit.id, batch.visitId))
    }

    for (const { event, at } of events) {
      if (event.type === 'search_submitted') {
        const query = maskPii(event.query)
        await tx
          .insert(search)
          .values({ id: event.searchId, visitId: batch.visitId, occurredAt: at, query, queryNormalized: normalizeQuery(query), inputMode: event.inputMode })
          .onConflictDoNothing()
      }
      if (event.type === 'results_shown') {
        const solutions = event.results.filter((result) => result.tier === 'solution').length
        await tx
          .update(search)
          .set({
            resultCount: event.results.length,
            solutionCount: solutions,
            relatedCount: event.results.length - solutions,
            noMatch: event.noMatch,
            latencyMs: event.latencyMs,
            error: event.error ?? false,
            shownResults: event.results,
          })
          .where(and(eq(search.id, event.searchId), eq(search.visitId, batch.visitId)))
      }
    }

    const rows = events.flatMap(({ event, at }) => toRow(batch.visitId, event, at))
    if (rows.length > 0) await tx.insert(analyticsEvent).values(rows)
  })
}

// Heartbeats only move visit.lastSeenAt; the search table already holds the Zapytanie and the Wyniki.
function toRow(visitId: string, event: AnalyticsEvent, occurredAt: Date): EventRow[] {
  if (event.type === 'visit_heartbeat') return []
  const { type, at: _at, ...rest } = event
  const searchId = 'searchId' in rest ? rest.searchId : undefined
  const innovationId = 'innovationId' in rest ? rest.innovationId : undefined
  const payload: Record<string, unknown> = { ...rest }
  delete payload.searchId
  delete payload.innovationId
  if (event.type === 'search_submitted') payload.query = maskPii(event.query)
  if (event.type === 'results_shown') payload.results = event.results.length
  return [{ visitId, searchId, innovationId, type, occurredAt, payload }]
}
