import { randomUUID } from 'node:crypto'
import { count } from 'drizzle-orm'
import { related, solutions } from '../ai/fixtures.js'
import { addDays, polishDay } from '../analytics/metrics.js'
import { normalizeQuery } from '../analytics/normalize.js'
import { refreshDailyRollups } from '../analytics/rollup.js'
import { db } from './index.js'
import { analyticsEvent, idea, need, search, visit, type SearchShownResult } from './schema.js'

// 30 days of fictional analytics so Statystyki has something to show. No real personal data:
// queries are invented, contacts use example.com and the 600 000 0xx range, ids are random.

const DAYS = 30
// Seeded PRNG: the same data on every machine.
let state = 20261004
function random() {
  state = (state + 0x6d2b79f5) | 0
  let t = Math.imul(state ^ (state >>> 15), 1 | state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const chance = (p: number) => random() < p
const between = (min: number, max: number) => Math.floor(min + random() * (max - min + 1))
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!
function weighted<T>(items: readonly (readonly [T, number])[]): T {
  let r = random() * items.reduce((total, [, w]) => total + w, 0)
  for (const [item, w] of items) if ((r -= w) <= 0) return item
  return items[0]![0]
}
const logNormal = (median: number, spread: number) => Math.round(median * Math.exp(spread * (random() + random() + random() - 1.5)))

type Profile = 'match' | 'related' | 'gap'
// [Zapytanie variants, profile, weight]. Variants differ in case/diacritics so normalizeQuery groups them.
const QUERIES: [string[], Profile, number][] = [
  [['mama po udarze potrzebuje opieki w domu', 'Mama po udarze potrzebuje opieki w domu', 'mama po udarze potrzebuje opieki'], 'match', 14],
  [['babcia nie radzi sobie z lekami', 'babcia nie radzi sobie z lekami ', 'Babcia nie radzi sobie z lekami'], 'match', 12],
  [['samotny sąsiad 80+ nie wychodzi z domu', 'samotny sasiad 80+ nie wychodzi z domu'], 'match', 10],
  [['tata z demencją wychodzi w nocy z domu', 'tata z demencja wychodzi w nocy z domu'], 'match', 9],
  [['opieka nad seniorem w miejscu zamieszkania'], 'match', 8],
  [['jak zorganizować opiekę dla dziadka'], 'match', 7],
  [['ćwiczenia dla seniora w domu', 'cwiczenia dla seniora w domu'], 'related', 7],
  [['tata się przewraca w mieszkaniu', 'tata sie przewraca w mieszkaniu'], 'related', 6],
  [['rehabilitacja po złamaniu biodra'], 'related', 5],
  [['mama zapomina wziąć tabletki'], 'match', 6],
  [['wypalenie opiekuna osoby starszej'], 'match', 5],
  [['gdzie szukać pomocy dla opiekuna rodzinnego'], 'match', 5],
  [['nie mam z kim zostawić dziecka po szkole'], 'gap', 7],
  [['syn ma problem z hazardem w internecie'], 'gap', 5],
  [['jak pomóc nastolatce z depresją', 'jak pomoc nastolatce z depresja'], 'gap', 6],
  [['brak transportu do lekarza na wsi'], 'related', 6],
  [['dziecko z autyzmem nie ma terapii w okolicy'], 'gap', 5],
  [['nie stać mnie na opał na zimę', 'nie stac mnie na opal na zime'], 'gap', 5],
  [['szukam pracy po 50 a nikt nie odpisuje'], 'gap', 5],
  [['jak wrócić do pracy po długiej chorobie'], 'gap', 4],
  [['wnuk całe dnie gra i nie chodzi do szkoły'], 'gap', 4],
  [['nie umiem załatwić spraw w urzędzie przez internet'], 'gap', 4],
  [['sąsiedzi hałasują a ja opiekuję się chorą żoną'], 'gap', 3],
  [['pomoc dla uchodźczyni z Ukrainy z dzieckiem'], 'gap', 3],
  [['niewidomy tata chce sam chodzić na zakupy'], 'related', 3],
  [['ciepłe kapcie dla babci żeby się nie poślizgnęła'], 'match', 3],
  [['zajęcia ruchowe dla seniorów w gminie'], 'related', 4],
]

const innovations = [...solutions, ...related]
const NEVER_USED = 'dla-seniorow__obu-obuwie-po-domu'
const toShown = (r: (typeof innovations)[number], tier: 'solution' | 'related', position: number): SearchShownResult => ({
  id: r.id,
  title: r.title,
  tier,
  position,
  category: r.category,
})

function resultsFor(profile: Profile): SearchShownResult[] {
  const shuffled = [...innovations].sort(() => random() - 0.5)
  const solutionCount = profile === 'match' ? between(1, 3) : 0
  const relatedCount = between(1, 3)
  return shuffled.slice(0, solutionCount + relatedCount).map((r, i) => toShown(r, i < solutionCount ? 'solution' : 'related', i + 1))
}

function actionFor(result: SearchShownResult) {
  const item = innovations.find((r) => r.id === result.id)!
  if (item.links?.phone) return 'phone' as const
  return weighted([
    ['innovation_page', 6],
    ['video', item.links?.video ? 2 : 0],
    ['pdf', item.links?.pdf ? 1 : 0],
    ['source', 1],
  ] as const)
}

// Searches per hour on a weekday: office hours peak 9–15, a smaller evening peak.
const HOURLY = [0.1, 0.05, 0.03, 0.03, 0.05, 0.2, 0.5, 1.2, 2.4, 3.6, 4, 4, 3.8, 3.6, 3.2, 2.6, 2, 1.8, 2, 2.1, 1.7, 1.1, 0.6, 0.3]

type Rows = {
  visits: (typeof visit.$inferInsert)[]
  searches: (typeof search.$inferInsert)[]
  events: (typeof analyticsEvent.$inferInsert)[]
  needs: (typeof need.$inferInsert & { id: string })[]
  ideas: (typeof idea.$inferInsert)[]
}

function generate(now: Date): Rows {
  const rows: Rows = { visits: [], searches: [], events: [], needs: [], ideas: [] }
  const today = polishDay(now)

  for (let d = DAYS - 1; d >= 0; d--) {
    const day = addDays(today, -d)
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
    const weekend = weekday === 0 || weekday === 6
    // Slow growth over the month, so the KPI deltas show a trend.
    const visitsToday = Math.round((weekend ? 38 : 78) * (0.8 + (0.4 * (DAYS - d)) / DAYS) * (0.85 + random() * 0.3))

    for (let v = 0; v < visitsToday; v++) {
      const hour = weighted(HOURLY.map((w, h) => [h, weekend && h > 7 && h < 16 ? w * 0.6 : w] as const))
      // Polish local time ≈ UTC+2 in this season; good enough for fictional data.
      let t = new Date(`${day}T00:00:00Z`).getTime() + (hour - 2) * 3_600_000 + between(0, 3_599) * 1000
      if (t > now.getTime()) continue
      const start = t
      const visitId = randomUUID()
      const kiosk = chance(0.27)
      const entry = weighted([['search', 70], ['catalog', 20], ['innovation', 5], ['idea', 2], ['other', 3]] as const)
      const event = (type: string, extra: Partial<typeof analyticsEvent.$inferInsert> = {}, payload: Record<string, unknown> = {}) =>
        rows.events.push({ visitId, type, occurredAt: new Date(t), payload, ...extra })

      const screen = kiosk ? 'tablet' : weighted([['mobile', 55], ['desktop', 35], ['tablet', 10]] as const)
      event('visit_started', {}, { mode: kiosk ? 'kiosk' : 'web', entry, screen })
      if (chance(kiosk ? 0.09 : 0.03)) event('text_size_changed', {}, { size: chance(0.85) ? 'large' : 'small' })

      if (entry === 'catalog') {
        t += between(10, 60) * 1000
        event('catalog_filtered', {}, { category: pick(['dla-seniorow', 'dla-zdrowia-i-medycyny', 'dla-rynku-pracy', 'dla-dzieci-mlodziezy-i-rodziny']) })
        if (chance(0.6)) {
          const item = pick(innovations)
          t += between(5, 40) * 1000
          event('innovation_viewed', { innovationId: item.id }, { from: 'catalog' })
          const dwellMs = logNormal(70_000, 1.2)
          t += dwellMs
          event('innovation_left', { innovationId: item.id }, { dwellMs })
        }
      }

      const searchCount = entry === 'catalog' ? (chance(0.3) ? 1 : 0) : weighted([[1, 60], [2, 28], [3, 12]] as const)
      for (let s = 0; s < searchCount; s++) {
        const [variants, profile] = weighted(QUERIES.map((q) => [q, q[2]] as const))
        const query = pick(variants)
        const searchId = randomUUID()
        const voice = chance(kiosk ? 0.32 : 0.12)
        t += between(8, 50) * 1000
        if (voice) {
          event('voice_used', {}, { outcome: 'started' })
          if (chance(0.11)) {
            event('voice_used', {}, { outcome: 'error' })
            continue
          }
          event('voice_used', {}, { outcome: 'recognized' })
        }
        const occurredAt = new Date(t)
        const error = chance(0.015)
        const noMatch = !error && chance(profile === 'gap' ? 0.88 : profile === 'related' ? 0.12 : 0.05)
        const results = error || noMatch ? [] : resultsFor(profile)
        const latencyMs = chance(0.03) ? between(5_200, 8_500) : logNormal(1_750, 0.5)
        const solutionCount = results.filter((r) => r.tier === 'solution').length
        rows.searches.push({
          id: searchId,
          visitId,
          occurredAt,
          query,
          queryNormalized: normalizeQuery(query),
          inputMode: voice ? 'voice' : 'text',
          resultCount: results.length,
          solutionCount,
          relatedCount: results.length - solutionCount,
          noMatch,
          latencyMs,
          error,
          shownResults: results,
        })
        event('search_submitted', { searchId }, { query, inputMode: voice ? 'voice' : 'text' })
        t += latencyMs
        event('results_shown', { searchId }, { latencyMs, noMatch, results: results.length, ...(error && { error: true }) })
        if (error) continue

        if (noMatch) {
          const gapId = randomUUID()
          rows.needs.push({ id: gapId, kind: 'gap', query, noMatch: true, searchId, createdAt: new Date(t), updatedAt: new Date(t) })
          const option = weighted([['none', 52], ['retry', 22], ['contact', 15], ['idea', 11]] as const)
          if (option === 'none') continue
          t += between(10, 40) * 1000
          event('no_result_option', { searchId }, { option })
          const gap = rows.needs.at(-1)!
          if (option === 'contact' && chance(0.7)) {
            t += between(40, 120) * 1000
            Object.assign(gap, { kind: 'contact_request', contact: `mieszkaniec${rows.needs.length}@example.com`, consentAt: new Date(t) })
          }
          if (option === 'idea') {
            const finished = chance(0.55)
            const lastStep = finished ? 6 : between(1, 5)
            for (let step = 1; step <= lastStep; step++) {
              t += between(20, 90) * 1000
              event('idea_step', { searchId }, { step, stepCount: 6 })
            }
            if (!finished) {
              event('idea_abandoned', {}, { lastStep })
              continue
            }
            gap.kind = 'idea'
            rows.ideas.push({
              needId: gapId,
              title: `Pomysł: ${query}`,
              answers: [{ question: 'Jaki problem rozwiązuje Twój pomysł?', answer: query }],
              contact: `600 000 ${String(rows.ideas.length % 1000).padStart(3, '0')}`,
              consentAt: new Date(t),
              createdAt: new Date(t),
              updatedAt: new Date(t),
            })
          }
          continue
        }

        // ~55–60 % of searches with Wyniki get an Użycie Akcji, mostly on the first Wynik.
        if (!chance(profile === 'match' ? 0.68 : 0.42)) continue
        const used = chance(0.25) ? 2 : 1
        for (let a = 0; a < used; a++) {
          const result = results[Math.min(results.length - 1, weighted([[0, 6], [1, 3], [2, 1], [3, 1]] as const))]!
          // Shown often, never used: gives "Innowacje bez kliknięć" an example.
          if (result.id === NEVER_USED) continue
          const action = actionFor(result)
          t += between(15, 90) * 1000
          event('action_used', { searchId, innovationId: result.id }, { action, position: result.position })
          if (action === 'innovation_page') {
            event('innovation_viewed', { searchId, innovationId: result.id }, { from: 'search' })
            const dwellMs = logNormal(95_000, 1.1)
            t += dwellMs
            event('innovation_left', { innovationId: result.id }, { dwellMs })
          }
        }
      }

      t += between(20, 180) * 1000
      const durationMs = Math.min(t - start, now.getTime() - start)
      const ended = chance(0.8)
      rows.visits.push({
        id: visitId,
        startedAt: new Date(start),
        lastSeenAt: new Date(start + durationMs),
        endedAt: ended ? new Date(start + durationMs) : null,
        durationMs: ended ? durationMs : null,
        mode: kiosk ? 'kiosk' : 'web',
        screen,
        entry,
      })
      if (ended) event('visit_ended', {}, { durationMs })
    }
  }
  return rows
}

async function insertChunked<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += 1000) await insert(rows.slice(i, i + 1000))
}

export async function seedAnalytics() {
  const [existing] = await db.select({ n: count() }).from(search)
  if ((existing?.n ?? 0) > 0) {
    console.log('Analytics already seeded, skipping.')
    return
  }
  const now = new Date()
  const rows = generate(now)
  await db.transaction(async (tx) => {
    await insertChunked(rows.visits, (chunk) => tx.insert(visit).values(chunk))
    await insertChunked(rows.searches, (chunk) => tx.insert(search).values(chunk))
    await insertChunked(rows.events, (chunk) => tx.insert(analyticsEvent).values(chunk))
    await insertChunked(rows.needs, (chunk) => tx.insert(need).values(chunk))
    await insertChunked(rows.ideas, (chunk) => tx.insert(idea).values(chunk))
  })
  const today = polishDay(now)
  await refreshDailyRollups(addDays(today, -(DAYS + 1)), today)
  console.log(
    `Created ${rows.visits.length} fictional Wizyty, ${rows.searches.length} Wyszukiwania, ${rows.events.length} events, ${rows.needs.length} Potrzeby from search.`,
  )
}
