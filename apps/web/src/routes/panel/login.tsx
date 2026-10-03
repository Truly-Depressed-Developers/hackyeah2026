import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '@/features/panel/login-form'
import { usePanelLogin } from '@/features/panel/use-panel-auth'
import { sessionQueryOptions } from '@/lib/auth'

export const Route = createFileRoute('/panel/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    // Only same-app paths, so the login page can't be used as an open redirect.
    // `//host` and `/\host` are protocol-relative URLs to another site.
    redirect:
      typeof search.redirect === 'string' && /^\/(?![/\\])/.test(search.redirect) ? search.redirect : undefined,
  }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions)
    if (session) throw redirect({ href: search.redirect ?? '/panel' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const login = usePanelLogin(redirectTo)

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <LoginForm onSubmit={login.mutate} isPending={login.isPending} error={login.error?.message} />
    </main>
  )
}
