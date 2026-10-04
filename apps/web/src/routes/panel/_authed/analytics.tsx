import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ActionsBreakdown, CategoriesBreakdown, ChannelsBreakdown, HourHeatmap } from '@/features/analytics/breakdowns'
import { RANGES, fmtDuration, fmtInt, fmtLatency, fmtPct, type RangeDays } from '@/features/analytics/format'
import { SearchFunnel } from '@/features/analytics/funnel'
import { KpiCard } from '@/features/analytics/kpi-card'
import { TopGaps, TopInnovations, TopQueries } from '@/features/analytics/rankings'
import { SearchesOverTime } from '@/features/analytics/searches-over-time'
import { trpc } from '@/lib/trpc'

const DEFAULT_RANGE: RangeDays = 30

export const Route = createFileRoute('/panel/_authed/analytics')({
  validateSearch: (search: Record<string, unknown>): { range?: RangeDays } => {
    const range = Number(search.range)
    return RANGES.includes(range as RangeDays) && range !== DEFAULT_RANGE ? { range: range as RangeDays } : {}
  },
  component: AnalyticsPage,
})

const state = <T,>(q: { data?: T; isPending: boolean; isError: boolean }) => ({ data: q.data, loading: q.isPending, error: q.isError })

const updatedFormat = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' })

function AnalyticsPage() {
  const { range = DEFAULT_RANGE } = Route.useSearch()
  const navigate = Route.useNavigate()
  const input = { days: range }
  // Keep the previous range on screen while the next one loads.
  const live = { placeholderData: keepPreviousData }

  // One tRPC batch per range change (httpBatchLink); each section shows its own loading and error state.
  const overview = useQuery({ ...trpc.panel.analytics.overview.queryOptions(input), ...live })
  const series = useQuery({ ...trpc.panel.analytics.searchesOverTime.queryOptions(input), ...live })
  const funnel = useQuery({ ...trpc.panel.analytics.funnel.queryOptions(input), ...live })
  const queries = useQuery({ ...trpc.panel.analytics.topQueries.queryOptions(input), ...live })
  const gaps = useQuery({ ...trpc.panel.analytics.topGaps.queryOptions(input), ...live })
  const innovations = useQuery({ ...trpc.panel.analytics.topInnovations.queryOptions(input), ...live })
  const actions = useQuery({ ...trpc.panel.analytics.actionsBreakdown.queryOptions(input), ...live })
  const heatmap = useQuery({ ...trpc.panel.analytics.hourHeatmap.queryOptions(input), ...live })
  const categories = useQuery({ ...trpc.panel.analytics.categories.queryOptions(input), ...live })
  const channels = useQuery({ ...trpc.panel.analytics.voiceAndAccessibility.queryOptions(input), ...live })

  const kpis = overview.data?.kpis
  const fetching = [overview, series, funnel, queries, gaps, innovations, actions, heatmap, categories, channels].some((q) => q.isFetching)

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-[650] tracking-[-0.02em]">Statystyki</h1>
          <p className="text-muted-foreground">
            Czego szukają mieszkańcy, co im pomaga i gdzie brakuje rozwiązań.
            {overview.data && <> Dane z {updatedFormat.format(new Date(overview.data.refreshedAt))}.</>}
          </p>
        </div>
        <ToggleGroup
          value={[String(range)]}
          onValueChange={(next) => {
            const days = Number(next[0]) as RangeDays
            if (RANGES.includes(days)) navigate({ search: days === DEFAULT_RANGE ? {} : { range: days }, replace: true })
          }}
          variant="outline"
          aria-label="Okres statystyk"
        >
          {RANGES.map((days) => (
            <ToggleGroupItem key={days} value={String(days)} className="px-3">
              {days} dni
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <p role="status" className="sr-only">
        {fetching ? 'Wczytywanie statystyk…' : `Statystyki z ostatnich ${range} dni.`}
      </p>
      {overview.isError && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Nie udało się wczytać statystyk: {overview.error.message}
        </p>
      )}

      <section aria-label="Najważniejsze liczby" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Wyszukiwania" kpi={kpis?.searches} format={fmtInt} color="var(--chart-1)" />
        <KpiCard label="Znaleziona pomoc" kpi={kpis?.helpfulPct} format={fmtPct} color="var(--success)" hint="Wyszukiwania z Użyciem Akcji, bez Potrzeby" />
        <KpiCard label="Brak odpowiedzi" kpi={kpis?.noMatchPct} format={fmtPct} lowerIsBetter color="var(--chart-4)" />
        <KpiCard label="Potrzeby z wyszukiwań" kpi={kpis?.needs} format={fmtInt} color="var(--chart-3)" />
        <KpiCard label="Wizyty" kpi={kpis?.visits} format={fmtInt} color="var(--chart-5)" />
        <KpiCard label="Średni czas Wizyty" kpi={kpis?.avgVisitMs} format={fmtDuration} color="var(--chart-2)" />
        <KpiCard
          label="Czas odpowiedzi wyszukiwarki"
          kpi={kpis?.medianLatencyMs}
          format={fmtLatency}
          lowerIsBetter
          limit={5000}
          color="var(--chart-1)"
          hint="Mediana; cel z PRD: poniżej 5 s"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <SearchesOverTime {...state(series)} className="xl:col-span-2" />
        <SearchFunnel {...state(funnel)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TopQueries {...state(queries)} />
        <TopGaps {...state(gaps)} />
      </div>

      <TopInnovations {...state(innovations)} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ActionsBreakdown {...state(actions)} />
        <CategoriesBreakdown {...state(categories)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HourHeatmap {...state(heatmap)} />
        <ChannelsBreakdown {...state(channels)} />
      </div>
    </>
  )
}
