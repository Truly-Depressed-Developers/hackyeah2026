import { useId } from 'react'
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@tabler/icons-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from 'cn'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Kpi } from './format'
import { useReducedMotion } from './use-reduced-motion'

interface KpiCardProps {
  label: string
  kpi: Kpi | undefined
  format: (value: number) => string
  /** For shares like Brak odpowiedzi or response time, a drop is the good news. */
  lowerIsBetter?: boolean
  /** Over this, the value is flagged (e.g. the 5 s NFR for search). */
  limit?: number
  color: string
  hint?: string
}

export function KpiCard({ label, kpi, format, lowerIsBetter, limit, color, hint }: KpiCardProps) {
  const gradientId = useId().replace(/:/g, '')
  const reducedMotion = useReducedMotion()

  if (!kpi) {
    return (
      <Card className="gap-3 p-5" aria-busy>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-full" />
      </Card>
    )
  }

  const value = kpi.value
  const delta = kpi.delta
  const good = delta === null || delta === 0 ? null : lowerIsBetter ? delta < 0 : delta > 0
  const overLimit = limit !== undefined && value !== null && value > limit
  const DeltaIcon = delta === null || delta === 0 ? IconMinus : delta > 0 ? IconArrowUpRight : IconArrowDownRight
  const deltaText =
    delta === null ? 'brak danych z poprzedniego okresu' : `${delta > 0 ? '+' : ''}${delta.toLocaleString('pl-PL')}% wobec poprzedniego okresu`

  return (
    <Card className="relative gap-1 overflow-hidden p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn('text-[1.75rem] leading-9 font-[650] tracking-[-0.03em] tabular-nums', overLimit && 'text-destructive')}>
        {value === null ? '—' : format(value)}
      </p>
      <p
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          good === null ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive',
        )}
      >
        <DeltaIcon aria-hidden="true" className="size-3.5" />
        {deltaText}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {/* Decorative trend line; the numbers above carry the meaning. */}
      <div aria-hidden="true" className="-mx-5 -mb-5 mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 48 }}>
        <AreaChart data={kpi.series.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={!reducedMotion} />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
