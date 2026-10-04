import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { IconBulb, IconClock, IconMicrophone, IconMoodCheck, IconSearchOff, IconTrendingDown, IconTrendingUp, type Icon } from '@tabler/icons-react'
import { cn } from 'cn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { fmtInt, fmtLatency, fmtPct, sumValues, type Analytics } from './format'

// The descriptive part of Statystyki: a handful of plain-language findings computed from the same data as the charts,
// so a Pracownik ROPS gets the story first and the charts as evidence.

interface InsightsData {
  overview?: Analytics['overview']
  gaps?: Analytics['topGaps']
  heatmap?: Analytics['hourHeatmap']
  channels?: Analytics['voiceAndAccessibility']
  innovations?: Analytics['topInnovations']
}

// For the sentence: "we wtorki około 18:00".
const ON_DAYS = ['w poniedziałki', 'we wtorki', 'w środy', 'w czwartki', 'w piątki', 'w soboty', 'w niedziele'] as const

type Tone = 'good' | 'bad' | 'info'

interface Insight {
  key: string
  icon: Icon
  tone: Tone
  text: ReactNode
}

const TONES: Record<Tone, string> = {
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
  bad: 'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
}

const strong = (children: ReactNode) => <strong className="font-semibold text-foreground">{children}</strong>
const link =
  'rounded-sm font-semibold text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function change(delta: number | null, lowerIsBetter = false) {
  if (delta === null || delta === 0) return null
  const better = lowerIsBetter ? delta < 0 : delta > 0
  return { better, text: `${delta > 0 ? 'wzrost' : 'spadek'} o ${fmtPct(Math.abs(delta))} wobec poprzedniego okresu` }
}

export function buildInsights({ overview, gaps, heatmap, channels, innovations }: InsightsData): Insight[] {
  const insights: Insight[] = []
  const kpis = overview?.kpis

  if (kpis?.helpfulPct.value != null && kpis.searches.value) {
    const c = change(kpis.helpfulPct.delta)
    insights.push({
      key: 'helpful',
      icon: c && !c.better ? IconTrendingDown : IconMoodCheck,
      tone: c && !c.better ? 'bad' : 'good',
      text: (
        <>
          {strong(fmtPct(kpis.helpfulPct.value))} z {fmtInt(kpis.searches.value)} wyszukiwań kończy się użyciem Akcji, czyli mieszkaniec znalazł pomoc
          {c ? ` (${c.text})` : ''}.
        </>
      ),
    })
  }

  const topGap = gaps?.[0]
  if (topGap) {
    insights.push({
      key: 'gap',
      icon: IconSearchOff,
      tone: 'bad',
      text: (
        <>
          Najczęściej bez pomocy kończy się pytanie{' '}
          <Link to="/panel/needs" search={{ q: topGap.query, status: 'all' }} className={link}>
            „{topGap.query}”
          </Link>{' '}
          ({fmtInt(topGap.count)} razy). To dobry kandydat na nową innowację.
        </>
      ),
    })
  } else if (kpis?.noMatchPct.value != null) {
    const c = change(kpis.noMatchPct.delta, true)
    insights.push({
      key: 'no-match',
      icon: c?.better ? IconTrendingDown : IconSearchOff,
      tone: c && !c.better ? 'bad' : 'info',
      text: (
        <>
          {strong(fmtPct(kpis.noMatchPct.value))} wyszukiwań kończy się Brakiem odpowiedzi{c ? ` (${c.text})` : ''}.
        </>
      ),
    })
  }

  const unused = innovations?.unused[0]
  if (unused) {
    insights.push({
      key: 'unused',
      icon: IconBulb,
      tone: 'info',
      text: (
        <>
          Innowacja{' '}
          <Link to="/panel/innovations/$innovationId" params={{ innovationId: unused.id }} className={link}>
            „{unused.title}”
          </Link>{' '}
          pojawiła się w wynikach {fmtInt(unused.shown)} razy, ale nikt nie użył jej Akcji. Warto poprawić jej opis lub materiały.
        </>
      ),
    })
  }

  const peak = heatmap?.reduce<Analytics['hourHeatmap'][number] | null>((best, c) => (!best || c.count > best.count ? c : best), null)
  if (peak && peak.count > 0) {
    insights.push({
      key: 'peak',
      icon: IconClock,
      tone: 'info',
      text: (
        <>
          Mieszkańcy szukają pomocy najczęściej {strong(`${ON_DAYS[peak.dow - 1]} około ${peak.hour}:00`)}. W tych godzinach warto mieć kogoś pod telefonem.
        </>
      ),
    })
  }

  const searches = sumValues(channels?.inputModes ?? {})
  const voice = channels?.inputModes.voice ?? 0
  if (searches > 0 && voice > 0) {
    insights.push({
      key: 'voice',
      icon: IconMicrophone,
      tone: 'info',
      text: (
        <>
          {strong(fmtPct((voice / searches) * 100))} wyszukiwań jest dyktowanych głosem: dla tych osób wyszukiwanie głosowe jest ważnym kanałem.
        </>
      ),
    })
  }

  const latency = kpis?.medianLatencyMs.value
  if (latency != null) {
    const ok = latency <= 5000
    insights.push({
      key: 'latency',
      icon: ok ? IconTrendingUp : IconClock,
      tone: ok ? 'good' : 'bad',
      text: ok ? (
        <>
          Wyszukiwarka odpowiada w medianie w {strong(fmtLatency(latency))}, w granicach celu 5 s.
        </>
      ) : (
        <>
          Wyszukiwarka odpowiada w medianie w {strong(fmtLatency(latency))}, wolniej niż cel 5 s. Zgłoś to zespołowi technicznemu.
        </>
      ),
    })
  }

  return insights
}

export function Insights({ loading, ...data }: InsightsData & { loading: boolean }) {
  const insights = buildInsights(data)
  return (
    <Card className="relative overflow-hidden">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
      <CardHeader>
        <CardTitle>
          <h2 className="text-lg font-[650] tracking-[-0.02em]">Najważniejsze wnioski</h2>
        </CardTitle>
        <CardDescription>Co mówią dane z wybranego okresu, w kilku zdaniach. Szczegóły i wykresy poniżej.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && insights.length === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">Za mało danych w tym okresie, żeby wyciągnąć wnioski.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {insights.map(({ key, icon: ItemIcon, tone, text }) => (
              <li key={key} className="flex gap-3 rounded-xl border bg-background/60 p-3.5 text-[0.9375rem] leading-6 text-muted-foreground">
                <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-5', TONES[tone])}>
                  <ItemIcon stroke={2} />
                </span>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
