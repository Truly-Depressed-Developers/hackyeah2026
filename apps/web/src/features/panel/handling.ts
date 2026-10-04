// Shared by Potrzeby and Pomysły: both use the same simple handling Stan for now.

export type HandlingStatus = 'new' | 'in_progress' | 'done'

export const statusLabel: Record<HandlingStatus, string> = {
  new: 'Nowe',
  in_progress: 'W toku',
  done: 'Załatwione',
}

export const isHandlingStatus = (value: unknown): value is HandlingStatus =>
  typeof value === 'string' && value in statusLabel

const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' })
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

const relative = new Intl.RelativeTimeFormat('pl-PL', { numeric: 'auto' })
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
]

/** "5 minut temu", "wczoraj": for the newest items on the dashboard; the full date sits in `title`/<time>. */
export function formatRelative(iso: string, now = Date.now()) {
  let value = (new Date(iso).getTime() - now) / 60_000
  if (Math.abs(value) < 1) return 'przed chwilą'
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit)
    value /= size
  }
  return relative.format(Math.round(value), 'year')
}
