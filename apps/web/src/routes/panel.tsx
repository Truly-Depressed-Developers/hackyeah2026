import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/panel')({
  component: () => (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6">
      <Outlet />
    </main>
  ),
})
