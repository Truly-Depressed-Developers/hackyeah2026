import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

export type Analytics = inferRouterOutputs<AppRouter>['panel']['analytics']
export type Kpi = Analytics['overview']['kpis']['searches']

export const RANGES = [7, 30, 90] as const
export type RangeDays = (typeof RANGES)[number]

const int = new Intl.NumberFormat('pl-PL')
const oneDecimal = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })

export const fmtInt = (n: number) => int.format(n)
export const fmtPct = (n: number) => `${oneDecimal.format(n)}%`

export function fmtDuration(ms: number) {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min ${seconds % 60} s`
}

export const fmtLatency = (ms: number) => (ms < 1000 ? `${ms} ms` : `${oneDecimal.format(ms / 1000)} s`)

const dayFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
/** Days arrive as 'YYYY-MM-DD' (Polish calendar days). */
export const fmtDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`))
export const fmtDayLong = (day: string) => weekdayFormat.format(new Date(`${day}T00:00:00Z`))

// Names residents and ROPS staff use (CONTEXT.md).
export const OUTCOMES = {
  helpful: { label: 'Znaleziona pomoc', color: 'var(--success)' },
  noAction: { label: 'Bez Akcji', color: 'var(--chart-muted)' },
  noMatch: { label: 'Brak odpowiedzi', color: 'var(--chart-4)' },
  need: { label: 'Zakończone Potrzebą', color: 'var(--chart-3)' },
} as const

export const ACTION_LABELS: Record<string, string> = {
  innovation_page: 'Strona innowacji',
  read_more: 'Szczegóły',
  video: 'Film',
  pdf: 'Dokument PDF',
  download: 'Pobranie materiałów',
  phone: 'Telefon',
  sms: 'SMS z kiosku',
  source: 'Strona źródłowa',
}

export const NO_RESULT_OPTIONS: Record<string, string> = {
  contact: 'Zostawili kontakt',
  idea: 'Zgłosili pomysł',
  retry: 'Przeglądali bazę wiedzy',
}

export const DOW = ['pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.'] as const

export const sumValues = (record: Record<string, number>) => Object.values(record).reduce((a, b) => a + b, 0)
