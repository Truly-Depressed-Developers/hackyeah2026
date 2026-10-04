import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { IconClockHour4, IconGauge, IconHeartHandshake, IconMoodCheck, IconSearch, IconSearchOff, IconUsers } from '@tabler/icons-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ActionsBreakdown, CategoriesBreakdown, ChannelsBreakdown, HourHeatmap } from '@/features/analytics/breakdowns'
import { RANGES, fmtDuration, fmtInt, fmtLatency, fmtPct, type RangeDays } from '@/features/analytics/format'
import { SearchFunnel } from '@/features/analytics/funnel'
import { Insights } from '@/features/analytics/insights'
import { KpiCard } from '@/features/analytics/kpi-card'
import { TopGaps, TopInnovations, TopQueries } from '@/features/analytics/rankings'
import { SearchesOverTime } from '@/features/analytics/searches-over-time'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS } from '@/features/panel/panel-sidebar'
import { Reveal } from '@/features/panel/reveal'
import { Tag } from '@/features/panel/tags'
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
      <PageHeader
        section={PANEL_SECTIONS.analytics}
        title="Statystyki"
        description="Czego szukają mieszkańcy, co im pomaga i gdzie brakuje rozwiązań. Każdy wykres ma podsumowanie i dane w tabeli."
        meta={
          overview.data && (
            <Tag tone="slate" icon={IconClockHour4}>
              Dane z {updatedFormat.format(new Date(overview.data.refreshedAt))}
            </Tag>
          )
        }
        actions={
          <ToggleGroup
            value={[String(range)]}
            onValueChange={(next) => {
              const days = Number(next[0]) as RangeDays
              if (RANGES.includes(days)) navigate({ search: days === DEFAULT_RANGE ? {} : { range: days }, replace: true })
            }}
            variant="outline"
            aria-label="Okres statystyk"
            className="rounded-xl bg-background/70 p-1 shadow-sm backdrop-blur"
          >
            {RANGES.map((days) => (
              <ToggleGroupItem
                key={days}
                value={String(days)}
                className="h-9 rounded-lg! border-0 px-3.5 data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                {days} dni
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      <p role="status" className="sr-only">
        {fetching ? 'Wczytywanie statystyk…' : `Statystyki z ostatnich ${range} dni.`}
      </p>
      {overview.isError && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Nie udało się wczytać statystyk: {overview.error.message}
        </p>
      )}

      <Reveal order={1}>
        <Insights
          loading={overview.isPending}
          overview={overview.data}
          gaps={gaps.data}
          heatmap={heatmap.data}
          channels={channels.data}
          innovations={innovations.data}
        />
      </Reveal>

      <section aria-label="Najważniejsze liczby" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Wyszukiwania" icon={IconSearch} kpi={kpis?.searches} format={fmtInt} color="var(--chart-1)" />
        <KpiCard
          label="Znaleziona pomoc"
          icon={IconMoodCheck}
          kpi={kpis?.helpfulPct}
          format={fmtPct}
          color="var(--success)"
          hint="Wyszukiwania z Użyciem Akcji, bez Potrzeby"
        />
        <KpiCard label="Brak odpowiedzi" icon={IconSearchOff} kpi={kpis?.noMatchPct} format={fmtPct} lowerIsBetter color="var(--chart-4)" />
        <KpiCard label="Potrzeby z wyszukiwań" icon={IconHeartHandshake} kpi={kpis?.needs} format={fmtInt} color="var(--chart-3)" />
        <KpiCard label="Wizyty" icon={IconUsers} kpi={kpis?.visits} format={fmtInt} color="var(--chart-5)" />
        <KpiCard label="Średni czas Wizyty" icon={IconClockHour4} kpi={kpis?.avgVisitMs} format={fmtDuration} color="var(--chart-2)" />
        <KpiCard
          label="Czas odpowiedzi wyszukiwarki"
          icon={IconGauge}
          className="sm:col-span-2"
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
