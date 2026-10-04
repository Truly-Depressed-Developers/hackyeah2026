import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
import { queryClient } from '@/lib/trpc'
import { applyStoredTextSize } from '@/components/layout/text-size'
import { startAnalytics } from '@/lib/analytics'
import { applyStoredLang } from '@/lib/i18n'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

applyStoredTextSize()
applyStoredLang()
startAnalytics()
// With registerType 'autoUpdate' this reloads the page once a new deploy's service worker takes over;
// without it the first visit after a deploy keeps running the previous build until a manual refresh.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
