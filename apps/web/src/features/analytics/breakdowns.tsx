import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartPanel } from './chart-panel'
import { ACTION_LABELS, DOW, fmtInt, fmtPct, sumValues, type Analytics } from './format'
import { useReducedMotion } from './use-reduced-motion'

type State<T> = { data: T | undefined; loading: boolean; error: boolean }

const actionsConfig = { count: { label: 'Użycia', color: 'var(--chart-1)' } } satisfies ChartConfig

export function ActionsBreakdown({ data, loading, error }: State<Analytics['actionsBreakdown']>) {
  const reducedMotion = useReducedMotion()
  const rows = Object.entries(data ?? {})
    .map(([key, count]) => ({ key, label: ACTION_LABELS[key] ?? key, count }))
    .toSorted((a, b) => b.count - a.count)
  const total = sumValues(data ?? {})

  return (
    <ChartPanel
      title="Jakie Akcje wybierają"
      loading={loading}
      error={error}
      summary={rows[0] ? `${fmtInt(total)} Użyć Akcji; najczęściej „${rows[0].label}” (${fmtPct((rows[0].count / total) * 100)}).` : 'Brak Użyć Akcji w tym okresie.'}
      table={<SimpleTable head={['Akcja', 'Użycia']} rows={rows.map((r) => [r.label, fmtInt(r.count)])} />}
    >
      <ChartContainer config={actionsConfig} className="aspect-auto w-full" style={{ height: Math.max(160, rows.length * 40) }}>
        <BarChart data={rows} layout="vertical" accessibilityLayer margin={{ left: 0, right: 40 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={150} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={6} isAnimationActive={!reducedMotion}>
            <LabelList dataKey="count" position="right" className="fill-foreground tabular-nums" formatter={(v) => fmtInt(Number(v))} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

const categoriesConfig = {
  searches: { label: 'Wyszukiwania z Wynikiem z kategorii', color: 'var(--chart-1)' },
  actions: { label: 'Użycia Akcji', color: 'var(--chart-2)' },
} satisfies ChartConfig

/** Short labels for the axis; the table keeps the full Kategoria names. */
const shortCategory = (name: string) => name.replace(/^Innowacje dla /, '').replace(/^osób /, '')

export function CategoriesBreakdown({ data, loading, error }: State<Analytics['categories']>) {
  const reducedMotion = useReducedMotion()
  const rows = (data ?? []).map((row) => ({ ...row, short: shortCategory(row.category) }))

  return (
    <ChartPanel
      title="Kategorie"
      loading={loading}
      error={error}
      summary={rows[0] ? `Najwięcej wyszukiwań dotyczy kategorii „${rows[0].category}”.` : 'Brak danych w tym okresie.'}
      table={<SimpleTable head={['Kategoria', 'Wyszukiwania', 'Użycia Akcji']} rows={rows.map((r) => [r.category, fmtInt(r.searches), fmtInt(r.actions)])} />}
    >
      <ChartContainer config={categoriesConfig} className="aspect-auto w-full" style={{ height: Math.max(200, rows.length * 44) }}>
        <BarChart data={rows} layout="vertical" accessibilityLayer margin={{ left: 0, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="short" tickLine={false} axisLine={false} width={170} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="searches" fill="var(--color-searches)" radius={4} isAnimationActive={!reducedMotion} />
          <Bar dataKey="actions" fill="var(--color-actions)" radius={4} isAnimationActive={!reducedMotion} />
        </BarChart>
      </ChartContainer>
    </ChartPanel>
  )
}

/** When residents search: days of the week × hours, darker = more Wyszukiwania. */
export function HourHeatmap({ data, loading, error }: State<Analytics['hourHeatmap']>) {
  const grid = new Map((data ?? []).map((c) => [`${c.dow}-${c.hour}`, c.count]))
  const max = Math.max(1, ...(data ?? []).map((c) => c.count))
  const peak = (data ?? []).reduce<{ dow: number; hour: number; count: number } | null>((best, c) => (!best || c.count > best.count ? c : best), null)
  const hours = Array.from({ length: 24 }, (_, h) => h)

  return (
    <ChartPanel
      title="Kiedy szukają pomocy"
      loading={loading}
      error={error}
      summary={peak ? `Najwięcej wyszukiwań: ${DOW[peak.dow - 1]} około ${peak.hour}:00 (${fmtInt(peak.count)}).` : 'Brak danych w tym okresie.'}
      table={
        <SimpleTable
          head={['Dzień', ...hours.map((h) => `${h}:00`)]}
          rows={DOW.map((day, i) => [day, ...hours.map((h) => fmtInt(grid.get(`${i + 1}-${h}`) ?? 0))])}
        />
      }
    >
      <div aria-hidden="true" className="overflow-x-auto">
        <div className="grid min-w-[36rem] grid-cols-[3rem_repeat(24,minmax(0,1fr))] gap-1 text-[0.6875rem] text-muted-foreground">
          <span />
          {hours.map((h) => (
            <span key={h} className="text-center tabular-nums">
              {h % 3 === 0 ? h : ''}
            </span>
          ))}
          {DOW.map((day, i) => (
            <div key={day} className="contents">
              <span className="self-center">{day}</span>
              {hours.map((h) => {
                const count = grid.get(`${i + 1}-${h}`) ?? 0
                return (
                  <span
                    key={h}
                    title={`${day} ${h}:00 — ${count}`}
                    className="aspect-square rounded-[4px] bg-chart-1"
                    style={{ opacity: count === 0 ? 0.06 : 0.15 + 0.85 * (count / max) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  )
}

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Strona www',
  kiosk: 'Kiosk',
  text: 'Pisane',
  voice: 'Głosem',
  started: 'Uruchomione',
  recognized: 'Rozpoznane',
  error: 'Błąd',
  unsupported: 'Nieobsługiwane',
  small: 'Mniejszy',
  normal: 'Standardowy',
  large: 'Większy',
}

function Split({ title, values, colors }: { title: string; values: Record<string, number>; colors: string[] }) {
  const entries = Object.entries(values).toSorted((a, b) => b[1] - a[1])
  const total = sumValues(values)
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Brak danych.</p>
      ) : (
        <>
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-muted">
            {entries.map(([key, n], i) => (
              <span key={key} className={colors[i % colors.length]} style={{ width: `${(n / total) * 100}%` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {entries.map(([key, n], i) => (
              <li key={key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${colors[i % colors.length]}`} />
                {CHANNEL_LABELS[key] ?? key}: <span className="font-[650] tabular-nums">{fmtPct((n / total) * 100)}</span>
                <span className="text-muted-foreground tabular-nums">({fmtInt(n)})</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** Web vs kiosk, typing vs voice, dictation reliability and text-size changes: signals for accessibility. */
export function ChannelsBreakdown({ data, loading, error }: State<Analytics['voiceAndAccessibility']>) {
  const kiosk = data?.visitModes.kiosk ?? 0
  const visits = sumValues(data?.visitModes ?? {})
  const voice = data?.inputModes.voice ?? 0
  const searches = sumValues(data?.inputModes ?? {})
  return (
    <ChartPanel
      title="Kanały i dostępność"
      loading={loading}
      error={error}
      summary={
        visits === 0
          ? 'Brak danych w tym okresie.'
          : `${fmtPct((kiosk / visits) * 100)} wizyt z kiosku, ${fmtPct(searches === 0 ? 0 : (voice / searches) * 100)} wyszukiwań głosem.`
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Split title="Skąd przychodzą" values={data?.visitModes ?? {}} colors={['bg-chart-1', 'bg-chart-2']} />
        <Split title="Jak wpisują pytanie" values={data?.inputModes ?? {}} colors={['bg-chart-5', 'bg-chart-3']} />
        <Split title="Rozpoznawanie mowy" values={data?.voiceOutcomes ?? {}} colors={['bg-success', 'bg-chart-1', 'bg-chart-4', 'bg-chart-muted']} />
        <Split title="Zmiany rozmiaru tekstu" values={data?.textSizes ?? {}} colors={['bg-chart-2', 'bg-chart-5', 'bg-chart-3']} />
      </div>
    </ChartPanel>
  )
}

function SimpleTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head.map((h, i) => (
            <TableHead key={h} className={i > 0 ? 'text-right' : undefined}>
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[0]}>
            {row.map((cell, i) => (
              <TableCell key={i} className={i > 0 ? 'text-right tabular-nums' : undefined}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

