import { Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PANEL_SECTIONS, PanelSidebar } from '@/features/panel/panel-sidebar'
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

// The sidebar writes its open/collapsed state to this cookie (components/ui/sidebar.tsx).
const sidebarOpen = () => !document.cookie.split('; ').includes('sidebar_state=false')

function PanelLayout() {
  const { session } = Route.useRouteContext()
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = Object.values(PANEL_SECTIONS)
    .toReversed()
    .find((section) => pathname === section.to || pathname.startsWith(`${section.to}/`))

  return (
    <SidebarProvider defaultOpen={sidebarOpen()}>
      <a
        href="#panel-main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Przejdź do treści
      </a>
      <PanelSidebar user={session.user} />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur-md sm:px-5">
          <SidebarTrigger className="size-9" />
          <Separator orientation="vertical" className="mx-1 h-5!" />
          <p className="truncate text-sm">
            <span className="text-muted-foreground">Panel administratora</span>
            {current && current.to !== '/panel' && (
              <>
                <span aria-hidden="true" className="mx-1.5 text-muted-foreground">
                  /
                </span>
                <span className="font-medium">{current.label}</span>
              </>
            )}
          </p>
        </header>
        <main id="panel-main" tabIndex={-1} className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
