import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

type PanelOutputs = inferRouterOutputs<AppRouter>['panel']['ideas']
export type IdeaDetail = PanelOutputs['get']
export type IdeaRow = PanelOutputs['list']['items'][number]
