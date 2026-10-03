import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'

// Placeholder start page; S-07 (zgłoszenia) and S-08 (materiały) land here.
export const Route = createFileRoute('/panel/_authed/')({
  component: PanelHome,
})

function PanelHome() {
  const me = useQuery(trpc.panel.me.queryOptions())

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Witaj{me.data ? `, ${me.data.name}` : ''}</h1>
        </CardTitle>
        <CardDescription>Tu pojawią się zgłoszenia mieszkańców i zarządzanie materiałami.</CardDescription>
      </CardHeader>
    </Card>
  )
}
