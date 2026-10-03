import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { PanelHeader } from '@/features/panel/panel-header'
import { sessionQueryOptions } from '@/lib/auth'

// Guard for every Panel administratora page. UX only: the API refuses panel data without a session anyway.
export const Route = createFileRoute('/panel/_authed')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions)
    if (!session) throw redirect({ to: '/panel/login', search: { redirect: location.href } })
    return { session }
  },
  component: PanelLayout,
})

function PanelLayout() {
  const { session } = Route.useRouteContext()

  return (
    <>
      <PanelHeader user={session.user} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </>
  )
}
