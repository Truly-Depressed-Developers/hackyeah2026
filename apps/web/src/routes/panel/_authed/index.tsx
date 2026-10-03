import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'

// Start page of the Panel administratora; S-08 (materiały) adds its entry here.
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
        <CardDescription>Zgłoszenia mieszkańców czekają na przejrzenie. Zarządzanie materiałami pojawi się wkrótce.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/panel/submissions" className={buttonVariants()}>
          Przejdź do zgłoszeń
        </Link>
      </CardContent>
    </Card>
  )
}
