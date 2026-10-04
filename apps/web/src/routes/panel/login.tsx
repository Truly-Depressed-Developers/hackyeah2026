import { createFileRoute, redirect } from '@tanstack/react-router'
import { PomostLogo } from '@/components/brand/pomost-logo'
import { LoginForm } from '@/features/panel/login-form'
import { useDocumentTitle } from '@/features/panel/use-document-title'
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
  useDocumentTitle('Logowanie')

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-panel-hero p-6">
      <PomostLogo size={3.25} />
      <LoginForm onSubmit={login.mutate} isPending={login.isPending} error={login.error?.message} />
    </main>
  )
}
