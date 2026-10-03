// Shared by Potrzeby and Pomysły: both use the same simple handling Stan for now.

export type HandlingStatus = 'new' | 'in_progress' | 'done'

export const statusLabel: Record<HandlingStatus, string> = {
  new: 'Nowe',
  in_progress: 'W toku',
  done: 'Załatwione',
}

export const statusBadge: Record<HandlingStatus, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  in_progress: 'secondary',
  done: 'outline',
}

export const isHandlingStatus = (value: unknown): value is HandlingStatus =>
  typeof value === 'string' && value in statusLabel

const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' })
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
