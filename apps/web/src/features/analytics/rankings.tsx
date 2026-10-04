import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { IconArrowDownRight, IconArrowUpRight, IconExternalLink } from '@tabler/icons-react'
import { cn } from 'cn'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tag } from '@/features/panel/tags'
import { ChartPanel } from './chart-panel'
import { fmtInt, fmtPct, type Analytics } from './format'

const linkClass =
  'rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** A bar inside a table cell: the number stays the information, the bar only helps the eye compare rows. */
function Meter({ value, max, className }: { value: number; max: number; className?: string }) {
  return (
    <span aria-hidden="true" className="block h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted">
      <span className={cn('block h-full rounded-full', className)} style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }} />
    </span>
  )
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">nowe</span>
  const up = value > 0
  const Icon = up ? IconArrowUpRight : IconArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 tabular-nums', up ? 'text-chart-1' : 'text-muted-foreground')}>
      <Icon aria-hidden="true" className="size-3.5" />
      {up ? '+' : ''}
      {value.toLocaleString('pl-PL')}%
    </span>
  )
}

type Queries = Analytics['topQueries']

export function TopQueries({ data, loading, error }: { data: Queries | undefined; loading: boolean; error: boolean }) {
  const max = data?.[0]?.count ?? 0
  return (
    <ChartPanel
      title="Najczęstsze Zapytania"
      loading={loading}
      error={error}
      summary={data?.length ? `Na pierwszym miejscu „${data[0]!.query}” (${fmtInt(data[0]!.count)} razy).` : 'Brak wyszukiwań w tym okresie.'}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zapytanie</TableHead>
            <TableHead className="text-right">Liczba</TableHead>
            <TableHead className="text-right">Z pomocą</TableHead>
            <TableHead className="text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="min-w-48 whitespace-normal">
                <span className="flex flex-col gap-1.5">
                  {row.query}
                  <Meter value={row.count} max={max} className="bg-chart-1" />
                </span>
              </TableCell>
              <TableCell className="text-right font-[650] tabular-nums">{fmtInt(row.count)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmtPct(row.helpfulPct)}</TableCell>
              <TableCell className="text-right">
                <Trend value={row.trend} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ChartPanel>
  )
}

type Gaps = Analytics['topGaps']

/** Zapytania that most often end without help: where ROPS should look for new Innowacje. */
export function TopGaps({ data, loading, error }: { data: Gaps | undefined; loading: boolean; error: boolean }) {
  const max = data?.[0]?.count ?? 0
  return (
    <ChartPanel
      title="Niezaspokojone potrzeby"
      loading={loading}
      error={error}
      summary={data?.length ? `Najczęściej bez pomocy: „${data[0]!.query}” (${fmtInt(data[0]!.count)} razy).` : 'W tym okresie każda potrzeba znalazła odpowiedź.'}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Zapytanie</TableHead>
            <TableHead className="text-right">Razem</TableHead>
            <TableHead className="text-right">Brak odpowiedzi</TableHead>
            <TableHead className="text-right">Potrzeby</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="min-w-48 whitespace-normal">
                <span className="flex flex-col gap-1.5">
                  <Link to="/panel/needs" search={{ q: row.query, status: 'all' }} className={linkClass}>
                    {row.query}
                  </Link>
                  <Meter value={row.count} max={max} className="bg-chart-4" />
                </span>
              </TableCell>
              <TableCell className="text-right font-[650] tabular-nums">{fmtInt(row.count)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmtInt(row.noMatch)}</TableCell>
              <TableCell className="text-right tabular-nums">{fmtInt(row.needs)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ChartPanel>
  )
}

type Innovations = Analytics['topInnovations']

/** Which Innowacje residents use once they see them (CTR), and which they skip — content worth improving. */
export function TopInnovations({ data, loading, error }: { data: Innovations | undefined; loading: boolean; error: boolean }) {
  const [view, setView] = useState<'best' | 'unused'>('best')
  const rows = data?.[view] ?? []
  const best = data?.best[0]

  return (
    <ChartPanel
      title="Skuteczność Innowacji"
      loading={loading}
      error={error}
      summary={
        best
          ? `Najczęściej używana: „${best.title}” — ${fmtPct(best.ctr)} wyszukiwań, w których się pojawiła, kończy się Akcją.`
          : 'Brak Użyć Akcji w tym okresie.'
      }
      actions={
        <ToggleGroup
          value={[view]}
          onValueChange={(next) => next[0] && setView(next[0] as 'best' | 'unused')}
          variant="outline"
          size="sm"
          aria-label="Widok listy innowacji"
        >
          <ToggleGroupItem value="best">Najskuteczniejsze</ToggleGroupItem>
          <ToggleGroupItem value="unused">Bez kliknięć</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{view === 'unused' ? 'Każda często pokazywana innowacja ma Użycia Akcji.' : 'Brak danych.'}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Innowacja</TableHead>
              <TableHead className="text-right">Pokazana</TableHead>
              <TableHead className="text-right">Śr. pozycja</TableHead>
              <TableHead className="text-right">Użycia Akcji</TableHead>
              <TableHead className="text-right">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="min-w-56 whitespace-normal">
                  <Link to="/panel/innovations/$innovationId" params={{ innovationId: row.id }} className={cn(linkClass, 'inline-flex items-center gap-1')}>
                    {row.title}
                    <IconExternalLink aria-hidden="true" className="size-3.5 text-muted-foreground" />
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtInt(row.shown)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.avgPosition.toLocaleString('pl-PL')}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtInt(row.actions)}</TableCell>
                <TableCell className="text-right">
                  <Tag tone={row.ctr >= 30 ? 'green' : row.ctr === 0 ? 'rose' : 'slate'} className="tabular-nums">
                    {fmtPct(row.ctr)}
                  </Tag>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ChartPanel>
  )
}
