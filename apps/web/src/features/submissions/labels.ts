import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

type PanelOutputs = inferRouterOutputs<AppRouter>['panel']['submissions']
export type SubmissionDetail = PanelOutputs['get']
export type SubmissionRow = PanelOutputs['list']['items'][number]
export type SubmissionKind = SubmissionDetail['kind']
export type SubmissionStatus = SubmissionDetail['status']

// Display names follow CONTEXT.md.
export const kindLabel: Record<SubmissionKind, string> = {
  gap: 'Luka',
  idea: 'Pomysł',
  contact_request: 'Prośba o kontakt',
}

export const statusLabel: Record<SubmissionStatus, string> = {
  new: 'Nowe',
  in_progress: 'W toku',
  done: 'Załatwione',
}

export const statusBadge: Record<SubmissionStatus, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  in_progress: 'secondary',
  done: 'outline',
}

export const tierLabel = { solution: 'Rozwiązanie', related: 'Rozwiązanie pokrewne' } as const

const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' })
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

/** Short description of what the Mieszkaniec left: the Pomysł title, or the Zapytanie for the rest. */
export const summary = (row: Pick<SubmissionRow, 'idea' | 'query'>) => row.idea?.title ?? row.query
