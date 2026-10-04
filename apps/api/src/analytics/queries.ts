import { and, gte, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../db/index.js'
import { analyticsDaily } from '../db/schema.js'
import { addDays, deltaPct, fillDays, rangeFor, share, type SearchOutcome } from './metrics.js'
import { dayStart } from './rollup.js'

// Aggregates for the Statystyki page. Series and KPIs come from analytics_daily; rankings from raw rows (indexed by time).

export type Range = ReturnType<typeof rangeFor>
type Daily = { day: string; metric: string; key: string; value: number }

async function rows<T>(query: SQL) {
  const result = await db.execute<T & Record<string, unknown>>(query)
  return result.rows as T[]
}

const daily = (from: string, to: string): Promise<Daily[]> =>
  db
    .select({ day: analyticsDaily.day, metric: analyticsDaily.metric, key: analyticsDaily.key, value: analyticsDaily.value })
    .from(analyticsDaily)
    .where(and(gte(analyticsDaily.day, from), lte(analyticsDaily.day, to)))

const sum = (data: Daily[], metric: string, key?: string) =>
  data.reduce((total, row) => (row.metric === metric && (key === undefined || row.key === key) ? total + Number(row.value) : total), 0)

const byKey = (data: Daily[], metric: string) => {
  const totals = new Map<string, number>()
  for (const row of data) if (row.metric === metric) totals.set(row.key, (totals.get(row.key) ?? 0) + Number(row.value))
  return Object.fromEntries(totals)
}

function perDay(range: Range, data: Daily[], pick: (day: Daily[]) => number) {
  const groups = new Map<string, Daily[]>()
  for (const row of data) groups.set(row.day, [...(groups.get(row.day) ?? []), row])
  return fillDays(range.from, range.to, [...groups].map(([day, list]) => ({ day, value: pick(list) })), { value: 0 }).map((d) => d.value)
}

/**
 * Searches in the range, with whether each one got an Użycie Akcji and whether it ended in a Potrzeba:
 * `needed` is one the Mieszkaniec left (Prośba o kontakt, Pomysł), `anyNeed` also counts an automatic Luka.
 */
const searchesIn = (from: string, to: string) => sql`
  select s.*,
         exists (select 1 from analytics_event e where e.search_id = s.id and e.type = 'action_used') as acted,
         exists (select 1 from need n where n.search_id = s.id and n.kind <> 'gap') as needed,
         exists (select 1 from need n where n.search_id = s.id) as "anyNeed"
  from search s
  where s.occurred_at >= ${dayStart(from)} and s.occurred_at < ${dayStart(addDays(to, 1))}`

const medianLatency = async (from: string, to: string) => {
  const [row] = await rows<{ p50: number | null }>(sql`
    select percentile_cont(0.5) within group (order by latency_ms)::float8 as p50
    from search
    where latency_ms is not null and not error and occurred_at >= ${dayStart(from)} and occurred_at < ${dayStart(addDays(to, 1))}`)
  return row?.p50 == null ? null : Math.round(row.p50)
}

function kpisOf(data: Daily[]) {
  const searches = sum(data, 'searches')
  const visits = sum(data, 'visits')
  return {
    searches,
    visits,
    helpfulPct: share(sum(data, 'searches', 'helpful'), searches),
    noMatchPct: share(sum(data, 'searches', 'no_match'), searches),
    needs: sum(data, 'needs_from_search'),
    avgVisitMs: visits === 0 ? 0 : Math.round(sum(data, 'visit_duration_ms') / visits),
  }
}

export async function overview(range: Range) {
  const [current, previous, latency, previousLatency] = await Promise.all([
    daily(range.from, range.to),
    daily(range.previousFrom, range.previousTo),
    medianLatency(range.from, range.to),
    medianLatency(range.previousFrom, range.previousTo),
  ])
  const now = kpisOf(current)
  const before = kpisOf(previous)
  const kpi = (value: number | null, previousValue: number | null, series: number[]) => ({
    value,
    previous: previousValue,
    delta: value === null || previousValue === null ? null : deltaPct(value, previousValue),
    series,
  })
  const pctOf = (outcome: SearchOutcome) => (day: Daily[]) => share(sum(day, 'searches', outcome), sum(day, 'searches'))
  return {
    searches: kpi(now.searches, before.searches, perDay(range, current, (d) => sum(d, 'searches'))),
    visits: kpi(now.visits, before.visits, perDay(range, current, (d) => sum(d, 'visits'))),
    helpfulPct: kpi(now.helpfulPct, before.helpfulPct, perDay(range, current, pctOf('helpful'))),
    noMatchPct: kpi(now.noMatchPct, before.noMatchPct, perDay(range, current, pctOf('no_match'))),
    needs: kpi(now.needs, before.needs, perDay(range, current, (d) => sum(d, 'needs_from_search'))),
    avgVisitMs: kpi(now.avgVisitMs, before.avgVisitMs, perDay(range, current, (d) => kpisOf(d).avgVisitMs)),
    medianLatencyMs: kpi(latency, previousLatency, perDay(range, current, (d) => sum(d, 'latency_p50'))),
  }
}

export async function searchesOverTime(range: Range) {
  const data = await daily(range.from, range.to)
  const days = new Map<string, Daily[]>()
  for (const row of data) if (row.metric === 'searches') days.set(row.day, [...(days.get(row.day) ?? []), row])
  const points = [...days].map(([day, list]) => ({
    day,
    helpful: sum(list, 'searches', 'helpful'),
    noAction: sum(list, 'searches', 'no_action'),
    noMatch: sum(list, 'searches', 'no_match'),
    need: sum(list, 'searches', 'need'),
  }))
  return fillDays(range.from, range.to, points, { helpful: 0, noAction: 0, noMatch: 0, need: 0 })
}

export async function funnel(range: Range) {
  const [[counts], options] = await Promise.all([
    rows<{ searches: number; shown: number; acted: number; needed: number }>(sql`
      select count(*)::int as searches,
             count(*) filter (where result_count > 0 and not coalesce(no_match, false))::int as shown,
             count(*) filter (where acted)::int as acted,
             count(*) filter (where "anyNeed")::int as needed
      from (${searchesIn(range.from, range.to)}) s`),
    daily(range.from, range.to),
  ])
  return { ...(counts ?? { searches: 0, shown: 0, acted: 0, needed: 0 }), noResultOptions: byKey(options, 'no_result_option') }
}

const LIMIT = 10

export async function topQueries(range: Range) {
  const middle = sql`${dayStart(range.from)} + (${dayStart(addDays(range.to, 1))} - ${dayStart(range.from)}) / 2`
  const list = await rows<{ key: string; query: string; n: number; helpful: number; recent: number; earlier: number }>(sql`
    select query_normalized as key,
           mode() within group (order by query) as query,
           count(*)::int as n,
           count(*) filter (where acted and not needed and not coalesce(no_match, false))::int as helpful,
           count(*) filter (where occurred_at >= ${middle})::int as recent,
           count(*) filter (where occurred_at < ${middle})::int as earlier
    from (${searchesIn(range.from, range.to)}) s
    group by 1 order by n desc, key limit ${LIMIT}`)
  return list.map(({ key, query, n, helpful, recent, earlier }) => ({
    key,
    query,
    count: n,
    helpfulPct: share(helpful, n),
    trend: deltaPct(recent, earlier),
  }))
}

export async function topGaps(range: Range) {
  const list = await rows<{ key: string; query: string; n: number; noMatch: number; needs: number }>(sql`
    select query_normalized as key,
           mode() within group (order by query) as query,
           count(*)::int as n,
           count(*) filter (where coalesce(no_match, false))::int as "noMatch",
           count(*) filter (where needed)::int as needs
    from (${searchesIn(range.from, range.to)}) s
    where coalesce(no_match, false) or "anyNeed"
    group by 1 order by n desc, key limit ${LIMIT}`)
  return list.map(({ key, query, n, noMatch, needs }) => ({ key, query, count: n, noMatch, needs }))
}

export async function topInnovations(range: Range) {
  const start = dayStart(range.from)
  const end = dayStart(addDays(range.to, 1))
  const list = await rows<{ id: string; title: string; shown: number; avgPosition: number; actions: number; usedIn: number }>(sql`
    with shown as (
      select r->>'id' as id, max(r->>'title') as title, count(*)::int as shown, avg((r->>'position')::int)::float8 as "avgPosition"
      from search s, jsonb_array_elements(s.shown_results) r
      where s.occurred_at >= ${start} and s.occurred_at < ${end}
      group by 1
    ), used as (
      select innovation_id as id, count(*)::int as actions, count(distinct search_id)::int as "usedIn"
      from analytics_event
      where type = 'action_used' and occurred_at >= ${start} and occurred_at < ${end}
      group by 1
    )
    select shown.*, coalesce(used.actions, 0) as actions, coalesce(used."usedIn", 0) as "usedIn"
    from shown left join used using (id)`)
  const withCtr = list.map((item) => ({ ...item, avgPosition: Math.round(item.avgPosition * 10) / 10, ctr: share(item.usedIn, item.shown) }))
  return {
    best: withCtr
      .filter((item) => item.actions > 0)
      .toSorted((a, b) => b.usedIn - a.usedIn || b.ctr - a.ctr)
      .slice(0, LIMIT),
    // Shown often, never used: content worth improving.
    unused: withCtr
      .filter((item) => item.actions === 0 && item.shown >= 3)
      .toSorted((a, b) => b.shown - a.shown)
      .slice(0, LIMIT),
  }
}

export async function actionsBreakdown(range: Range) {
  return byKey(await daily(range.from, range.to), 'action_used')
}

export async function hourHeatmap(range: Range) {
  const cells = await rows<{ dow: number; hour: number; n: number }>(sql`
    select extract(isodow from occurred_at at time zone 'Europe/Warsaw')::int as dow,
           extract(hour from occurred_at at time zone 'Europe/Warsaw')::int as hour,
           count(*)::int as n
    from search
    where occurred_at >= ${dayStart(range.from)} and occurred_at < ${dayStart(addDays(range.to, 1))}
    group by 1, 2`)
  return cells.map(({ dow, hour, n }) => ({ dow, hour, count: n }))
}

export async function categories(range: Range) {
  const start = dayStart(range.from)
  const end = dayStart(addDays(range.to, 1))
  const [shown, used] = await Promise.all([
    rows<{ category: string; searches: number }>(sql`
      select coalesce(nullif(r->>'category', ''), 'Bez kategorii') as category, count(distinct s.id)::int as searches
      from search s, jsonb_array_elements(s.shown_results) r
      where s.occurred_at >= ${start} and s.occurred_at < ${end}
      group by 1`),
    rows<{ category: string; actions: number }>(sql`
      select coalesce(nullif(r->>'category', ''), 'Bez kategorii') as category, count(*)::int as actions
      from analytics_event e
      join search s on s.id = e.search_id
      cross join lateral jsonb_array_elements(s.shown_results) r
      where e.type = 'action_used' and r->>'id' = e.innovation_id and e.occurred_at >= ${start} and e.occurred_at < ${end}
      group by 1`),
  ])
  const actions = new Map(used.map((row) => [row.category, row.actions]))
  return shown
    .map((row) => ({ category: row.category, searches: row.searches, actions: actions.get(row.category) ?? 0 }))
    .toSorted((a, b) => b.searches - a.searches)
}

export async function voiceAndAccessibility(range: Range) {
  const data = await daily(range.from, range.to)
  return {
    visitModes: byKey(data, 'visits'),
    inputModes: byKey(data, 'input_mode'),
    voiceOutcomes: byKey(data, 'voice_used'),
    textSizes: byKey(data, 'text_size_changed'),
  }
}
