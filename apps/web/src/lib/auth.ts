import { queryOptions } from '@tanstack/react-query'
import { createAuthClient } from 'better-auth/react'

// Talks to better-auth on the API at /api/auth (same origin; Vite proxies it in dev).
export const authClient = createAuthClient()

export const sessionQueryOptions = queryOptions({
  queryKey: ['auth', 'session'],
  queryFn: async () => {
    const { data } = await authClient.getSession()
    return data ?? null
  },
  staleTime: 60_000,
})
