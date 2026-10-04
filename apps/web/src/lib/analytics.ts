import type { AnalyticsEvent } from 'api/analytics-events'

// Anonymous analytics for Statystyki (HAC-18, docs/specs/hac-18-analytics.md §5).
// A Wizyta is a random id in sessionStorage; no cookies, no accounts, nothing that follows a person across Wizyty.
// Events are queued and sent in batches; sending never blocks or breaks the UI.

const VISIT_KEY = 'pomost:visit'
const SEARCH_KEY = 'pomost:search'
const KIOSK_KEY = 'pomost:kiosk'
const ENDPOINT = '/api/events'
const FLUSH_MS = 5_000
const HEARTBEAT_MS = 30_000
const MAX_BATCH = 50

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type TrackedEvent = DistributiveOmit<AnalyticsEvent, 'at'>
export type Action = Extract<AnalyticsEvent, { type: 'action_used' }>['action']

type Visit = { id: string; startedAt: number }
/** The Wyszukiwanie the Mieszkaniec is looking at; later events (Akcje, Potrzeby) link to it. */
type CurrentSearch = { id: string; query: string; positions: Record<string, number> }

let queue: AnalyticsEvent[] = []
let visit: Visit | null = null
let timer: ReturnType<typeof setTimeout> | undefined

// The Panel administratora is staff, not residents: never tracked.
const enabled = () => typeof window !== 'undefined' && !window.location.pathname.startsWith('/panel')

function read<T>(storage: Storage, key: string): T | null {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null') as T | null
  } catch {
    return null
  }
}

function write(storage: Storage, key: string, value: unknown) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
  } catch {
    // Blocked storage: analytics carry on for this page only.
  }
}

function screen() {
  const width = window.innerWidth
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
}

function entry() {
  const path = window.location.pathname
  if (path.startsWith('/innowacja')) return 'innovation'
  if (path.startsWith('/pomysl')) return 'idea'
  return path === '/' ? (new URLSearchParams(window.location.search).has('q') ? 'search' : 'catalog') : 'other'
}

/** A kiosk opens the app once with ?kiosk=1; the device remembers it. */
function mode() {
  if (new URLSearchParams(window.location.search).has('kiosk')) write(localStorage, KIOSK_KEY, true)
  return read<boolean>(localStorage, KIOSK_KEY) ? 'kiosk' : 'web'
}

function ensureVisit(): Visit {
  if (visit) return visit
  visit = read<Visit>(sessionStorage, VISIT_KEY)
  if (!visit) {
    visit = { id: crypto.randomUUID(), startedAt: Date.now() }
    write(sessionStorage, VISIT_KEY, visit)
    queue.push({ type: 'visit_started', at: new Date().toISOString(), mode: mode(), entry: entry(), screen: screen() })
  }
  return visit
}

export function track(event: TrackedEvent) {
  if (!enabled()) return
  ensureVisit()
  queue.push({ ...event, at: new Date().toISOString() } as AnalyticsEvent)
  if (queue.length >= MAX_BATCH) flush()
  else timer ??= setTimeout(() => flush(), FLUSH_MS)
}

/** Sends what is queued. On page hide only a beacon survives, so use it there. */
export function flush(beacon = false) {
  clearTimeout(timer)
  timer = undefined
  if (!visit || queue.length === 0) return
  while (queue.length > 0) {
    const body = JSON.stringify({ visitId: visit.id, events: queue.splice(0, MAX_BATCH) })
    const sent = beacon && navigator.sendBeacon?.(ENDPOINT, body)
    if (!sent) void fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {})
  }
}

/** Kiosk reset: close this Wizyta and start a new one for the next Mieszkaniec. */
export function resetVisit() {
  if (visit) track({ type: 'visit_ended', durationMs: Date.now() - visit.startedAt })
  flush(true)
  visit = null
  write(sessionStorage, VISIT_KEY, null)
  write(sessionStorage, SEARCH_KEY, null)
  ensureVisit()
}

/** Called once from main.tsx: starts the Wizyta, heartbeats while visible, closes on page hide. */
export function startAnalytics() {
  if (!enabled()) return
  ensureVisit()
  flush()
  setInterval(() => {
    if (document.visibilityState === 'visible' && enabled()) track({ type: 'visit_heartbeat' })
  }, HEARTBEAT_MS)
  window.addEventListener('pagehide', () => {
    if (visit && enabled()) track({ type: 'visit_ended', durationMs: Date.now() - visit.startedAt })
    flush(true)
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}

// ---- Wyszukiwanie context ----

let pendingInputMode: 'text' | 'voice' = 'text'

/** The next Wyszukiwanie comes from voice (call right before running it). */
export const markVoiceInput = () => {
  pendingInputMode = 'voice'
}

export function startSearch(query: string) {
  const current: CurrentSearch = { id: crypto.randomUUID(), query, positions: {} }
  write(sessionStorage, SEARCH_KEY, current)
  track({ type: 'search_submitted', searchId: current.id, query, inputMode: pendingInputMode })
  pendingInputMode = 'text'
  return current.id
}

export function currentSearch(): CurrentSearch | null {
  return read<CurrentSearch>(sessionStorage, SEARCH_KEY)
}

export const currentSearchId = () => currentSearch()?.id
export const currentSearchQuery = () => currentSearch()?.query

type ShownResult = { id: string; title: string; tier: 'solution' | 'related'; category?: string }

export function resultsShown(searchId: string, latencyMs: number, outcome: { noMatch: boolean; results: ShownResult[]; error?: boolean }) {
  const results = outcome.results.map((result, i) => ({ ...result, position: i + 1 }))
  const current = currentSearch()
  if (current?.id === searchId) {
    write(sessionStorage, SEARCH_KEY, { ...current, positions: Object.fromEntries(results.map((r) => [r.id, r.position])) })
  }
  track({ type: 'results_shown', searchId, latencyMs: Math.round(latencyMs), noMatch: outcome.noMatch, results, error: outcome.error })
}

/** The Mieszkaniec's choice on the Brak odpowiedzi screen, tied to the Wyszukiwanie that led there. */
export function trackNoResultOption(option: 'idea' | 'contact' | 'retry') {
  const searchId = currentSearchId()
  if (searchId) track({ type: 'no_result_option', searchId, option })
}

// ---- Akcje and Innowacje ----

/** An Użycie Akcji. Linked to the current Wyszukiwanie when the Innowacja was one of its Wyniki. */
export function trackAction(innovationId: string, action: Action) {
  const current = currentSearch()
  const position = current?.positions[innovationId]
  if (action === 'innovation_page') nextInnovationFrom = position ? 'search' : 'catalog'
  track({ type: 'action_used', innovationId, action, ...(position && { searchId: current.id, position }) })
}

let nextInnovationFrom: 'search' | 'catalog' | null = null

/** A catalog tile was opened (call on click). */
export const markFromCatalog = () => {
  nextInnovationFrom = 'catalog'
}

/** Innowacja page shown; returns the cleanup that records how long it was read. */
export function viewInnovation(innovationId: string) {
  const from = nextInnovationFrom ?? 'direct'
  nextInnovationFrom = null
  const current = currentSearch()
  const searchId = from === 'search' && current?.positions[innovationId] ? current.id : undefined
  track({ type: 'innovation_viewed', innovationId, from, searchId })
  const shownAt = Date.now()
  let left = false
  const leave = () => {
    if (left) return
    left = true
    track({ type: 'innovation_left', innovationId, dwellMs: Date.now() - shownAt })
  }
  // The page-wide pagehide flush may already have run, so send this one itself.
  const onPageHide = () => {
    leave()
    flush(true)
  }
  window.addEventListener('pagehide', onPageHide, { once: true })
  return () => {
    window.removeEventListener('pagehide', onPageHide)
    leave()
  }
}
