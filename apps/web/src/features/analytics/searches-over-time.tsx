import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartPanel } from './chart-panel'
import { OUTCOMES, fmtDay, fmtDayLong, fmtInt, fmtPct, type Analytics } from './format'
import { useReducedMotion } from './use-reduced-motion'

type Point = Analytics['searchesOverTime'][number]

const config = Object.fromEntries(Object.entries(OUTCOMES).map(([key, { label, color }]) => [key, { label, color }])) satisfies ChartConfig
const keys = Object.keys(OUTCOMES) as (keyof typeof OUTCOMES)[]

export function SearchesOverTime({ data, loading, error, className }: { data: Point[] | undefined; loading: boolean; error: boolean; className?: string }) {
  const reducedMotion = useReducedMotion()
  const totals = Object.fromEntries(keys.map((k) => [k, (data ?? []).reduce((sum, d) => sum + d[k], 0)])) as Record<(typeof keys)[number], number>
  const all = keys.reduce((sum, k) => sum + totals[k], 0)
  const busiest = (data ?? []).reduce<Point | null>((best, d) => (!best || total(d) > total(best) ? d : best), null)

  return (
    <ChartPanel
      title="Wyszukiwania w czasie"
      className={className}
      loading={loading}
      error={error}
      summary={
        all === 0
          ? 'Brak wyszukiwań w tym okresie.'
          : `${fmtInt(all)} wyszukiwań: ${fmtPct((totals.helpful / all) * 100)} ze znalezioną pomocą, ${fmtPct((totals.noMatch / all) * 100)} bez odpowiedzi.` +
            (busiest ? ` Najwięcej: ${fmtDayLong(busiest.day)} (${fmtInt(total(busiest))}).` : '')
      }
      table={
        data && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dzień</TableHead>
                {keys.map((k) => (
                  <TableHead key={k} className="text-right">
                    {OUTCOMES[k].label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.day}>
                  <TableCell>{fmtDayLong(d.day)}</TableCell>
                  {keys.map((k) => (
                    <TableCell key={k} className="text-right tabular-nums">
                      {fmtInt(d[k])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    >
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <BarChart data={data} accessibilityLayer margin={{ left: -16, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={fmtDay} />
          <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(day) => fmtDayLong(String(day))} />} />
          <ChartLegend content={<ChartLegendContent />} />
          {keys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId="outcome"
              fill={`var(--color-${k})`}
              radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={!reducedMotion}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

const total = (d: Point) => d.helpful + d.noAction + d.noMatch + d.need
