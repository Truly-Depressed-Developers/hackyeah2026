import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'

// Start page of the Panel administratora.
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
        <CardDescription>Potrzeby i pomysły mieszkańców czekają na przejrzenie. W bazie wiedzy dodasz i poprawisz innowacje, które podpowiada wyszukiwarka.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link to="/panel/needs" className={buttonVariants()}>
          Potrzeby mieszkańców
        </Link>
        <Link to="/panel/ideas" className={buttonVariants({ variant: 'outline' })}>
          Pomysły mieszkańców
        </Link>
        <Link to="/panel/innovations" className={buttonVariants({ variant: 'outline' })}>
          Baza wiedzy: innowacje
        </Link>
      </CardContent>
    </Card>
  )
}
