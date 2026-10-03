import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

type PanelOutputs = inferRouterOutputs<AppRouter>['panel']['innovations']
export type InnovationDetail = PanelOutputs['get']
export type InnovationRow = PanelOutputs['list']['items'][number]
export type InnovationCategory = PanelOutputs['categories'][number]
export type InnovationInput = inferRouterInputs<AppRouter>['panel']['innovations']['create']
