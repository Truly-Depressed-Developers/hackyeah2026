import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { authClient, sessionQueryOptions } from '@/lib/auth'

// Login/logout logic for the Panel administratora, kept apart from the markup so the UI can be swapped.

export function usePanelLogin(redirectTo = '/panel') {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { error } = await authClient.signIn.email(credentials)
      if (error) throw new Error('Nieprawidłowy e-mail lub hasło.')
    },
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: sessionQueryOptions.queryKey })
      await router.navigate({ href: redirectTo })
    },
  })
}

export function usePanelLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      // Drop every cached query so no panel data survives the logout.
      queryClient.clear()
      await router.navigate({ to: '/panel/login' })
    },
  })
}
