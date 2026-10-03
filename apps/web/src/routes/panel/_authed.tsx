import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { usePanelLogout } from '@/features/panel/use-panel-auth'
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
  const logout = usePanelLogout()

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-medium">Panel administratora</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{session.user.email}</span>
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Wyloguj
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  )
}
