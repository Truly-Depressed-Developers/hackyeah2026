import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6">
      <Outlet />
    </main>
  ),
})
