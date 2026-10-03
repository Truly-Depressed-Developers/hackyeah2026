import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/toast'

// Each panel page owns its layout: the login centers a card, the logged-in pages get the top bar.
// Save results across the panel show as toasts (features/panel/notify.ts).
export const Route = createFileRoute('/panel')({
  component: () => (
    <Toaster>
      <div className="flex min-h-svh flex-col">
        <Outlet />
      </div>
    </Toaster>
  ),
})
