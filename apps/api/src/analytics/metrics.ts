// Pure helpers behind the Statystyki numbers. Days are calendar days in Poland, as YYYY-MM-DD strings.

export const TIME_ZONE = 'Europe/Warsaw'

export type SearchOutcome = 'helpful' | 'no_action' | 'no_match' | 'need'

/**
 * How a Wyszukiwanie ended. A Potrzeba the Mieszkaniec left wins (they said nothing helped), then Brak odpowiedzi;
 * Znaleziona pomoc is at least one Użycie Akcji and no Potrzeba. `needs` excludes the automatic Luka,
 * which every Brak odpowiedzi gets.
 */
export function searchOutcome({ noMatch, actions, needs }: { noMatch: boolean | null; actions: number; needs: number }): SearchOutcome {
  if (needs > 0) return 'need'
  if (noMatch) return 'no_match'
  return actions > 0 ? 'helpful' : 'no_action'
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export function share(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10
}

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

export const polishDay = (date: Date) => dayFormat.format(date)

export function addDays(day: string, n: number) {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + n)
  return date.toISOString().slice(0, 10)
}

/** The last `days` days including today, and the same number of days right before them. */
export function rangeFor(days: number, now: Date) {
  const to = polishDay(now)
  const from = addDays(to, -(days - 1))
  return { from, to, previousFrom: addDays(from, -days), previousTo: addDays(from, -1) }
}

export function fillDays<T extends { day: string }>(from: string, to: string, rows: T[], empty: Omit<T, 'day'>): T[] {
  const byDay = new Map(rows.map((row) => [row.day, row]))
  const filled: T[] = []
  for (let day = from; day <= to; day = addDays(day, 1)) filled.push(byDay.get(day) ?? ({ ...empty, day } as T))
  return filled
}
