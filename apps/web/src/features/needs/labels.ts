import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

type PanelOutputs = inferRouterOutputs<AppRouter>['panel']['needs']
export type NeedDetail = PanelOutputs['get']
export type NeedRow = PanelOutputs['list']['items'][number]
export type NeedKind = NeedDetail['kind']

// Display names follow CONTEXT.md.
export const kindLabel: Record<NeedKind, string> = {
  gap: 'Luka',
  idea: 'Pomysł',
  contact_request: 'Prośba o kontakt',
}

export const tierLabel = { solution: 'Rozwiązanie', related: 'Rozwiązanie pokrewne' } as const
