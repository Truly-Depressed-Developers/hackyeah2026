import { useId } from 'react'
import { IconArrowDownRight, IconArrowUpRight, IconMinus, type Icon } from '@tabler/icons-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from 'cn'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CountUp } from './count-up'
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
  icon: Icon
  hint?: string
  className?: string
}

export function KpiCard({ label, kpi, format, lowerIsBetter, limit, color, icon: Icon, hint, className }: KpiCardProps) {
  const gradientId = useId().replace(/:/g, '')
  const reducedMotion = useReducedMotion()

  if (!kpi) {
    return (
      <Card className={cn('gap-3 p-5', className)} aria-busy>
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

  return (
    <Card
      className={cn('group/kpi relative gap-0 overflow-hidden p-5 transition-shadow duration-300 hover:shadow-md', className)}>
      {/* Soft glow in the KPI's colour, decorative. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-500 group-hover/kpi:opacity-25"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-[18px]"
          style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
        >
          <Icon stroke={2} />
        </span>
      </div>
      <p className={cn('mt-1 text-[2rem] leading-10 font-[680] tracking-[-0.035em] tabular-nums', overLimit && 'text-destructive')}>
        {value === null ? '—' : <CountUp value={value} format={format} />}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
        {delta === null ? (
          <span className="text-muted-foreground">brak danych z poprzedniego okresu</span>
        ) : (
          <>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums',
                good === null
                  ? 'bg-muted text-muted-foreground'
                  : good
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100'
                    : 'bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100',
              )}
            >
              <DeltaIcon aria-hidden="true" className="size-3.5" />
              {delta > 0 ? '+' : ''}
              {delta.toLocaleString('pl-PL')}%
            </span>
            <span className="text-muted-foreground">wobec poprzedniego okresu</span>
          </>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {/* Decorative trend line; the numbers above carry the meaning. The series ends today, which is still
          in progress, so the line stops at yesterday instead of always ending in a drop. */}
      <div aria-hidden="true" className="-mx-5 mt-3 -mb-5 h-14">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 56 }}>
          <AreaChart data={kpi.series.slice(0, -1).map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
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
