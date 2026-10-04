import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconHeartHandshake,
  IconMoodCheck,
  IconPlus,
  IconSearch,
  IconSearchOff,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtInt, fmtPct } from '@/features/analytics/format'
import { KpiCard } from '@/features/analytics/kpi-card'
import { formatDate, formatRelative } from '@/features/panel/handling'
import { newIdeasQuery, newNeedsQuery } from '@/features/panel/inbox'
import { PageHeader } from '@/features/panel/page-header'
import { PANEL_SECTIONS, SectionChip, type PanelSection } from '@/features/panel/panel-sidebar'
import { Reveal } from '@/features/panel/reveal'
import { KindTag, Tag } from '@/features/panel/tags'
import { trpc } from '@/lib/trpc'

// Start page of the Panel administratora: what is new since the last visit and how the last 7 days went.
export const Route = createFileRoute('/panel/_authed/')({
  component: PanelHome,
})

const WEEK = { days: 7 } as const
const PREVIEW = 5
const todayFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

function greeting(now: Date) {
  const hour = now.getHours()
  return hour < 5 || hour >= 18 ? 'Dobry wieczór' : 'Dzień dobry'
}

const link =
  'rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function PanelHome() {
  const { session } = Route.useRouteContext()
  const needs = useQuery(newNeedsQuery())
  const ideas = useQuery(newIdeasQuery())
  const overview = useQuery(trpc.panel.analytics.overview.queryOptions(WEEK))
  const gaps = useQuery(trpc.panel.analytics.topGaps.queryOptions(WEEK))
  const kpis = overview.data?.kpis
  const firstName = session.user.name.split(/\s+/)[0]
  // Fixed for the visit, so the greeting does not change under the reader.
  const [now] = useState(() => new Date())

  return (
    <>
      <PageHeader
        section={PANEL_SECTIONS.start}
        title={
          <>
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}
            <span aria-hidden="true"> 👋</span>
          </>
        }
        description={`Dziś ${todayFormat.format(now)}. Oto co czeka na przejrzenie i jak mieszkańcom poszło w ostatnich 7 dniach.`}
        meta={
          <>
            <Tag tone="rose" icon={IconHeartHandshake}>
              {needs.data ? `Nowe potrzeby: ${fmtInt(needs.data.total)}` : 'Nowe potrzeby: …'}
            </Tag>
            <Tag tone="teal" icon={PANEL_SECTIONS.ideas.icon}>
              {ideas.data ? `Nowe pomysły: ${fmtInt(ideas.data.total)}` : 'Nowe pomysły: …'}
            </Tag>
          </>
        }
        actions={
          <Link to="/panel/innovations/new" className={buttonVariants({ className: 'h-10 px-4 shadow-md shadow-primary/20' })}>
            <IconPlus aria-hidden="true" data-icon="inline-start" />
            Dodaj innowację
          </Link>
        }
      />

      <Reveal order={1}>
        <section aria-labelledby="week-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="week-heading" className="text-lg font-[650] tracking-[-0.02em]">
              Ostatnie 7 dni
            </h2>
            <Link to="/panel/analytics" search={{ range: 7 }} className={cn(link, 'inline-flex items-center gap-1 text-sm text-primary')}>
              Pełne statystyki
              <IconArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {overview.isError && (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              Nie udało się wczytać statystyk.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Wyszukiwania" kpi={kpis?.searches} format={fmtInt} color="var(--chart-1)" icon={IconSearch} />
            <KpiCard label="Znaleziona pomoc" kpi={kpis?.helpfulPct} format={fmtPct} color="var(--success)" icon={IconMoodCheck} />
            <KpiCard label="Brak odpowiedzi" kpi={kpis?.noMatchPct} format={fmtPct} lowerIsBetter color="var(--chart-4)" icon={IconSearchOff} />
            <KpiCard label="Potrzeby z wyszukiwań" kpi={kpis?.needs} format={fmtInt} color="var(--chart-3)" icon={IconHeartHandshake} />
          </div>
        </section>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal order={2}>
          <InboxCard
            section={PANEL_SECTIONS.needs}
            title="Nowe potrzeby"
            total={needs.data?.total}
            loading={needs.isPending}
            error={needs.isError}
            empty="Wszystkie potrzeby przejrzane. Świetna robota!"
            more={
              <Link to="/panel/needs" className={cn(link, 'inline-flex items-center gap-1 text-sm text-primary')}>
                Wszystkie nowe potrzeby
                <IconArrowRight aria-hidden="true" className="size-4" />
              </Link>
            }
          >
            {needs.data?.items.slice(0, PREVIEW).map((need) => (
              <InboxRow key={need.id} createdAt={need.createdAt} badge={<KindTag kind={need.kind} />}>
                <Link to="/panel/needs" search={{ id: need.id }} className={cn(link, 'line-clamp-2 break-words')}>
                  {need.query}
                </Link>
              </InboxRow>
            ))}
          </InboxCard>
        </Reveal>

        <Reveal order={3}>
          <InboxCard
            section={PANEL_SECTIONS.ideas}
            title="Nowe pomysły"
            total={ideas.data?.total}
            loading={ideas.isPending}
            error={ideas.isError}
            empty="Brak nowych pomysłów od mieszkańców."
            more={
              <Link to="/panel/ideas" className={cn(link, 'inline-flex items-center gap-1 text-sm text-primary')}>
                Wszystkie nowe pomysły
                <IconArrowRight aria-hidden="true" className="size-4" />
              </Link>
            }
          >
            {ideas.data?.items.slice(0, PREVIEW).map((idea) => (
              <InboxRow key={idea.id} createdAt={idea.createdAt}>
                <Link to="/panel/ideas/$ideaId" params={{ ideaId: idea.id }} className={cn(link, 'line-clamp-2 break-words')}>
                  {idea.title}
                </Link>
              </InboxRow>
            ))}
          </InboxCard>
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal order={4} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                <h2 className="flex items-center gap-2 text-base font-[650]">
                  <IconAlertTriangle aria-hidden="true" className="size-5 text-chart-3" />
                  Gdzie brakuje pomocy
                </h2>
              </CardTitle>
              <CardDescription>Zapytania z ostatnich 7 dni, które najczęściej kończą się bez pomocy. Kandydaci na nowe innowacje.</CardDescription>
            </CardHeader>
            <CardContent>
              {gaps.isPending ? (
                <Skeleton className="h-40 w-full rounded-lg" />
              ) : gaps.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  Nie udało się wczytać danych.
                </p>
              ) : gaps.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">W tym tygodniu każda potrzeba znalazła odpowiedź.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {gaps.data.slice(0, PREVIEW).map((gap, i) => (
                    <li key={gap.key} className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900 tabular-nums dark:bg-amber-400/15 dark:text-amber-100"
                      >
                        {i + 1}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link to="/panel/needs" search={{ q: gap.query, status: 'all' }} className={cn(link, 'truncate text-sm')}>
                          {gap.query}
                        </Link>
                        <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-linear-to-r from-chart-3 to-chart-4"
                            style={{ width: `${(gap.count / gaps.data[0]!.count) * 100}%` }}
                          />
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {fmtInt(gap.count)}
                        <span className="sr-only"> razy</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal order={5} className="lg:col-span-2">
          <nav aria-labelledby="shortcuts-heading" className="flex h-full flex-col gap-3">
            <h2 id="shortcuts-heading" className="text-lg font-[650] tracking-[-0.02em]">
              Na skróty
            </h2>
            <ul className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Shortcut section={PANEL_SECTIONS.needs} to="/panel/needs" search={{ kind: 'gap' }} title="Przejrzyj Luki" text="Pytania bez żadnej odpowiedzi" />
              <Shortcut section={PANEL_SECTIONS.innovations} to="/panel/innovations" title="Baza wiedzy" text="Popraw opisy i materiały innowacji" />
              <Shortcut section={PANEL_SECTIONS.analytics} to="/panel/analytics" title="Statystyki" text="Czego szukają mieszkańcy i co pomaga" />
            </ul>
          </nav>
        </Reveal>
      </div>
    </>
  )
}

interface InboxCardProps {
  section: PanelSection
  title: string
  total: number | undefined
  loading: boolean
  error: boolean
  empty: string
  more: ReactNode
  children: ReactNode
}

function InboxCard({ section, title, total, loading, error, empty, more, children }: InboxCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>
          <h2 className="flex items-center gap-2.5 text-base font-[650]">
            <SectionChip section={section} className="size-7 [&_svg]:size-4" />
            {title}
          </h2>
        </CardTitle>
        {total !== undefined && total > 0 && (
          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
            {fmtInt(total)}
            <span className="sr-only"> nowych</span>
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się wczytać listy.
          </p>
        ) : total === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100">
            <IconMoodCheck aria-hidden="true" className="size-5 shrink-0" />
            {empty}
          </p>
        ) : (
          <>
            <ul className="-mx-2 flex flex-col">{children}</ul>
            <div className="mt-auto pt-1">{more}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InboxRow({ createdAt, badge, children }: { createdAt: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-1.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="flex min-w-0 flex-col gap-1.5">
        {badge}
        {children}
      </span>
      <time dateTime={createdAt} title={formatDate(createdAt)} className="shrink-0 text-xs whitespace-nowrap text-muted-foreground sm:pt-0.5">
        {formatRelative(createdAt)}
      </time>
    </li>
  )
}

function Shortcut({
  section,
  to,
  search,
  title,
  text,
}: {
  section: PanelSection
  to: '/panel/needs' | '/panel/innovations' | '/panel/analytics'
  search?: { kind: 'gap' }
  title: string
  text: string
}) {
  return (
    <li>
      <Link
        to={to}
        search={search}
        className="group flex h-full items-center gap-3 rounded-2xl border bg-card p-4 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:hover:translate-y-0"
      >
        <SectionChip section={section} className="size-10 rounded-xl [&_svg]:size-5" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{title}</span>
          <span className="text-sm text-muted-foreground">{text}</span>
        </span>
        <IconArrowRight aria-hidden="true" className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  )
}
