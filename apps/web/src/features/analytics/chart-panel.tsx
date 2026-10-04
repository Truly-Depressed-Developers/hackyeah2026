import { useId, type ReactNode } from 'react'
import { IconTable } from '@tabler/icons-react'
import { cn } from 'cn'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartPanelProps {
  title: string
  /** One-line reading of the chart for everyone, including screen readers (WCAG 1.1.1). */
  summary: ReactNode
  /** The same data as a table: the accessible alternative to the visual chart. */
  table?: ReactNode
  loading?: boolean
  error?: boolean
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** A titled card around one statistic, with a text summary and a "show as table" disclosure. */
export function ChartPanel({ title, summary, table, loading, error, actions, className, children }: ChartPanelProps) {
  const summaryId = useId()

  return (
    <Card className={cn('gap-4', className)} aria-busy={loading || undefined}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>
            <h2 className="text-base font-[650] tracking-[-0.01em]">{title}</h2>
          </CardTitle>
          <CardDescription id={summaryId}>{loading ? 'Wczytywanie…' : error ? 'Nie udało się wczytać danych.' : summary}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="flex flex-col gap-3" aria-describedby={summaryId}>
        {loading ? <Skeleton className="h-48 w-full rounded-lg" /> : error ? null : children}
        {table && !loading && !error && (
          <details className="group text-sm">
            <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-md text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <IconTable aria-hidden="true" className="size-4" />
              <span className="group-open:hidden">Pokaż dane w tabeli</span>
              <span className="hidden group-open:inline">Ukryj tabelę</span>
            </summary>
            <div className="mt-3 overflow-x-auto">{table}</div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
