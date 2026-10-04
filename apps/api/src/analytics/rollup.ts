import { and, gte, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/index.js'
import { analyticsDaily } from '../db/schema.js'
import { addDays, polishDay, searchOutcome, TIME_ZONE } from './metrics.js'

// Daily rollups (ADR-0002). The Statystyki page reads these for its series and KPIs; rankings read raw rows.

const STALE_MS = 10 * 60_000
/** On the first refresh after a start, cover the longest range plus its previous period. */
const FULL_DAYS = 180

/** Midnight of a Polish calendar day, as a timestamptz. */
export const dayStart = (day: string) => sql`((${day}::date)::timestamp at time zone ${TIME_ZONE})`
/** The Polish calendar day of a timestamptz column, as 'YYYY-MM-DD'. */
export const dayOf = (column: SQL) => sql<string>`to_char((${column} at time zone ${TIME_ZONE})::date, 'YYYY-MM-DD')`

type Row = { day: string; metric: string; key: string; value: number }

async function rows<T>(query: SQL) {
  const result = await db.execute<T & Record<string, unknown>>(query)
  return result.rows as T[]
}

/** Facts per Wyszukiwanie, already grouped so the outcome can be decided by searchOutcome(). */
export function searchFacts(from: string, to: string, groupBy: SQL = sql`''`) {
  return rows<{ day: string; group: string; noMatch: boolean; acted: boolean; needed: boolean; n: number }>(sql`
    select ${dayOf(sql`s.occurred_at`)} as day,
           ${groupBy} as "group",
           coalesce(s.no_match, false) as "noMatch",
           exists (select 1 from analytics_event e where e.search_id = s.id and e.type = 'action_used') as acted,
           exists (select 1 from need n where n.search_id = s.id and n.kind <> 'gap') as needed,
           count(*)::int as n
    from search s
    where s.occurred_at >= ${dayStart(from)} and s.occurred_at < ${dayStart(addDays(to, 1))}
    group by 1, 2, 3, 4, 5`)
}

export const outcomeOf = (fact: { noMatch: boolean; acted: boolean; needed: boolean }) =>
  searchOutcome({ noMatch: fact.noMatch, actions: fact.acted ? 1 : 0, needs: fact.needed ? 1 : 0 })

async function computeDays(from: string, to: string): Promise<Row[]> {
  const start = dayStart(from)
  const end = dayStart(addDays(to, 1))
  const out: Row[] = []
  const add = (day: string, metric: string, key: string, value: number) => out.push({ day, metric, key, value })

  const [facts, visits, needs, inputModes, latency, events] = await Promise.all([
    searchFacts(from, to),
    rows<{ day: string; mode: string; n: number; durationMs: number }>(sql`
      select ${dayOf(sql`started_at`)} as day, mode::text as mode, count(*)::int as n,
             coalesce(sum(coalesce(duration_ms, extract(epoch from last_seen_at - started_at) * 1000)), 0)::float8 as "durationMs"
      from visit where started_at >= ${start} and started_at < ${end} group by 1, 2`),
    rows<{ day: string; n: number }>(sql`
      select ${dayOf(sql`created_at`)} as day, count(*)::int as n
      from need where search_id is not null and created_at >= ${start} and created_at < ${end} group by 1`),
    rows<{ day: string; mode: string; n: number }>(sql`
      select ${dayOf(sql`occurred_at`)} as day, input_mode::text as mode, count(*)::int as n
      from search where occurred_at >= ${start} and occurred_at < ${end} group by 1, 2`),
    rows<{ day: string; p50: number }>(sql`
      select ${dayOf(sql`occurred_at`)} as day, percentile_cont(0.5) within group (order by latency_ms)::float8 as p50
      from search where latency_ms is not null and not error and occurred_at >= ${start} and occurred_at < ${end} group by 1`),
    rows<{ day: string; type: string; key: string; n: number }>(sql`
      select ${dayOf(sql`occurred_at`)} as day, type,
             coalesce(payload->>'action', payload->>'outcome', payload->>'size', payload->>'option', '') as key,
             count(*)::int as n
      from analytics_event
      where type in ('action_used', 'voice_used', 'text_size_changed', 'no_result_option')
        and occurred_at >= ${start} and occurred_at < ${end}
      group by 1, 2, 3`),
  ])

  const outcomes = new Map<string, number>()
  for (const fact of facts) {
    const key = `${fact.day}|${outcomeOf(fact)}`
    outcomes.set(key, (outcomes.get(key) ?? 0) + fact.n)
  }
  for (const [key, n] of outcomes) {
    const [day, outcome] = key.split('|') as [string, string]
    add(day, 'searches', outcome, n)
  }
  for (const v of visits) {
    add(v.day, 'visits', v.mode, v.n)
    add(v.day, 'visit_duration_ms', v.mode, v.durationMs)
  }
  for (const n of needs) add(n.day, 'needs_from_search', '', n.n)
  for (const m of inputModes) add(m.day, 'input_mode', m.mode, m.n)
  for (const l of latency) add(l.day, 'latency_p50', '', Math.round(l.p50))
  for (const e of events) add(e.day, e.type, e.key, e.n)
  return out
}

/** Recomputes the rollups for the days from..to (inclusive). */
export async function refreshDailyRollups(from: string, to: string) {
  const computed = await computeDays(from, to)
  await db.transaction(async (tx) => {
    await tx.delete(analyticsDaily).where(and(gte(analyticsDaily.day, from), lte(analyticsDaily.day, to)))
    for (let i = 0; i < computed.length; i += 1000) await tx.insert(analyticsDaily).values(computed.slice(i, i + 1000))
  })
}

let refreshedAt: Date | null = null
let running: Promise<void> | null = null

/** Refreshes if the rollups are older than 10 minutes. Older days don't change, so later refreshes cover the last two. */
export function ensureFreshRollups(now = new Date()): Promise<Date> {
  if (refreshedAt && now.getTime() - refreshedAt.getTime() < STALE_MS) return Promise.resolve(refreshedAt)
  running ??= (async () => {
    const to = polishDay(now)
    await refreshDailyRollups(addDays(to, refreshedAt ? -1 : -(FULL_DAYS - 1)), to)
    refreshedAt = now
  })().finally(() => {
    running = null
  })
  return running.then(() => refreshedAt!)
}

/** After seeding, all of history may have changed. */
export function invalidateRollups() {
  refreshedAt = null
}
