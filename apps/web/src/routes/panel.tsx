import { Outlet, createFileRoute } from '@tanstack/react-router'

// Each panel page owns its layout: the login centers a card, the logged-in pages get the top bar.
export const Route = createFileRoute('/panel')({
  component: () => (
    <div className="flex min-h-svh flex-col">
      <Outlet />
    </div>
  ),
})
