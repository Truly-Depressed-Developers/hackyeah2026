import { cn } from 'cn'
import { ChartPanel } from './chart-panel'
import { NO_RESULT_OPTIONS, fmtInt, fmtPct, sumValues, type Analytics } from './format'

type Funnel = Analytics['funnel']

/** From a Zapytanie to help: how many Wyszukiwania get Wyniki, how many lead to an Akcja, how many end as a Potrzeba. */
export function SearchFunnel({ data, loading, error }: { data: Funnel | undefined; loading: boolean; error: boolean }) {
  const steps = data
    ? [
        { label: 'Wyszukiwania', value: data.searches, color: 'bg-chart-1' },
        { label: 'Pokazane Wyniki', value: data.shown, color: 'bg-chart-5' },
        { label: 'Użycie Akcji', value: data.acted, color: 'bg-success' },
        { label: 'Zakończone Potrzebą', value: data.needed, color: 'bg-chart-3' },
      ]
    : []
  const top = data?.searches ?? 0
  const options = data?.noResultOptions ?? {}
  const optionsTotal = sumValues(options)

  return (
    <ChartPanel
      title="Lejek: od pytania do pomocy"
      loading={loading}
      error={error}
      summary={
        top === 0
          ? 'Brak wyszukiwań w tym okresie.'
          : `${fmtPct(((data?.acted ?? 0) / top) * 100)} wyszukiwań kończy się użyciem Akcji, ${fmtPct(((data?.needed ?? 0) / top) * 100)} — Potrzebą.`
      }
    >
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const pct = top === 0 ? 0 : (step.value / top) * 100
          return (
            <li key={step.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {step.label}
                </span>
                <span className="tabular-nums">
                  <span className="font-[650]">{fmtInt(step.value)}</span>
                  <span className="text-muted-foreground"> · {fmtPct(pct)}</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div className={cn('h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none', step.color)} style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
      {optionsTotal > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <p className="font-medium">Co robią po Braku odpowiedzi</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {Object.entries(options).map(([key, n]) => (
              <li key={key}>
                {NO_RESULT_OPTIONS[key] ?? key}: <span className="font-[650] tabular-nums">{fmtInt(n)}</span>{' '}
                <span className="text-muted-foreground">({fmtPct((n / optionsTotal) * 100)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartPanel>
  )
}
