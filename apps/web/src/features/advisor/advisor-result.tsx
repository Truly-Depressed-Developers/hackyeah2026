import { useState } from 'react'
import {
  IconCircleCheck,
  IconCircleX,
  IconCoins,
  IconCopy,
  IconMail,
  IconPercentage,
  IconRefresh,
  IconBulb,
  IconSparkles,
} from '@tabler/icons-react'
import { cn } from 'cn'
import { ghostButton } from '@/components/resident/controls'
import { AdvisorReport } from './advisor-report'
import type { Scorecard } from './advisor-stream'
import { aiBadge, formatPln, formatPoints, panel, panelTitle, primarySmallButton, whiteButton } from './advisor-ui'
import type { AdvisorState } from './use-advisor'

const CRITERIA: { key: 'eas' | 'uvi' | 'tnb' | 'ifs' | 'gep'; label: string }[] = [
  { key: 'eas', label: 'Zgodność z diagnozą ROPS' },
  { key: 'uvi', label: 'Pilność potrzeby' },
  { key: 'tnb', label: 'Potrzeby w powiecie' },
  { key: 'ifs', label: 'Wykonalność innowacji' },
  { key: 'gep', label: 'Zgodność z naborem' },
]

// ROPS evaluation rules for Usługa Wrażliwa: services / management / promotion and accessibility.
const BUDGET = [
  { label: 'Działania merytoryczne', share: 0.8, percent: '80%', color: '#2263AD' },
  { label: 'Zarządzanie i koordynacja', share: 1 / 6, percent: '16,7%', color: '#7FA8D9' },
  { label: 'Promocja i dostępność (WCAG)', share: 1 / 30, percent: '3,3%', color: '#2E9E74' },
]

const PRIORITY: Record<string, string> = { A: 'wysoki priorytet', B: 'średni priorytet', C: 'niski priorytet' }

interface AdvisorResultProps {
  state: AdvisorState
  query: string
  context: string
  onEmail: () => void
  onAgain: () => void
}

export function AdvisorResult({ state, query, context, onEmail, onAgain }: AdvisorResultProps) {
  const [copied, setCopied] = useState(false)
  const matched = state.grantMatch?.matched ?? state.scorecard?.is_grant_matched ?? false

  async function copy() {
    try {
      await navigator.clipboard.writeText(state.markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-muted-foreground">Twój pomysł · {context}</span>
          <span className="max-w-[47.5rem] text-lg leading-[1.625rem] font-semibold break-words">„{query}”</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={copy} className={whiteButton}>
            <IconCopy aria-hidden="true" />
            {copied ? 'Skopiowano' : 'Kopiuj tekst'}
          </button>
          <button type="button" onClick={onEmail} className={primarySmallButton}>
            <IconMail aria-hidden="true" />
            Wyślij PDF na e-mail
          </button>
        </div>
        <span role="status" className="sr-only">
          {copied ? 'Skopiowano szkic wniosku do schowka' : ''}
        </span>
      </div>

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {state.scorecard && <ScorePanel scorecard={state.scorecard} matched={matched} />}
        <GrantPanel state={state} matched={matched} />
      </div>

      {matched && state.maxFundingPln ? <BudgetPanel total={state.maxFundingPln} /> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-labelledby="advisor-doc-title" className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="advisor-doc-title" className={panelTitle}>
              Szkic wniosku
            </h2>
            <span className={aiBadge}>
              <IconSparkles aria-hidden="true" />
              Wygenerowane przez AI
            </span>
          </div>
          {/* The full dossier runs to several screens; a scroll box keeps the sources beside it in reach. */}
          <div tabIndex={0} role="region" aria-label="Treść szkicu wniosku" className="max-h-[40rem] overflow-y-auto pr-2 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <AdvisorReport markdown={state.markdown} />
          </div>
          <p className="rounded-[0.875rem] bg-[#FFF7E6] px-3.5 py-3 text-sm leading-5 text-[#7A4B00]">
            To szkic przygotowany automatycznie. Sprawdź dane przed złożeniem wniosku.
          </p>
        </section>

        <Sources state={state} matched={matched} />
      </div>

      <div className="flex justify-center pt-2">
        <button type="button" onClick={onAgain} className={ghostButton}>
          <IconRefresh aria-hidden="true" />
          Sprawdź inny pomysł
        </button>
      </div>
    </div>
  )
}

function ScorePanel({ scorecard, matched }: { scorecard: Scorecard; matched: boolean }) {
  const total = scorecard.total_wtd
  const grade = /Klasa\s+([A-D])/.exec(scorecard.grade)?.[1]

  return (
    <section aria-labelledby="advisor-score-title" className={cn(panel, 'gap-[1.125rem]')}>
      <h2 id="advisor-score-title" className={panelTitle}>
        Ocena pomysłu
      </h2>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <div role="img" aria-label={`Wynik ${formatPoints(total)} na ${scorecard.total_max} punktów`} className="relative size-[8.75rem] shrink-0">
          <Ring value={total / scorecard.total_max} width={10} />
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <b className="text-[2.25rem] leading-10 font-bold tracking-[-0.03em]">{formatPoints(total)}</b>
            <span className="text-[0.8125rem] font-semibold text-muted-foreground">na {scorecard.total_max} pkt</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-[1_1_12.5rem] flex-col gap-2.5">
          <span className="inline-flex min-h-[2.125rem] w-fit items-center rounded-full bg-[#E2F4EC] px-3.5 py-1 text-[0.9375rem] font-[650] text-[#0F5F45]">
            {grade ? `Klasa ${grade}${PRIORITY[grade] ? ` · ${PRIORITY[grade]}` : ''}` : scorecard.grade}
          </span>
          <span className="text-base leading-6 text-[#3B4757]">
            {matched
              ? 'Pomysł odpowiada potrzebom opisanym w raportach ROPS i spełnia warunki naboru.'
              : 'Pomysł nie pasuje do bieżącego naboru. W szkicu wniosku doradca opisuje inne ścieżki finansowania.'}
          </span>
        </div>
      </div>
      <ul className="flex flex-col border-t">
        {CRITERIA.map(({ key, label }) => {
          const value = scorecard[key]
          const max = scorecard[`${key}_max`]
          return (
            <li key={key} className="flex items-center gap-3.5 border-b py-3 last:border-b-0 last:pb-0">
              <span aria-hidden="true" className="size-9 shrink-0">
                <Ring value={max ? value / max : 0} width={12} />
              </span>
              <span className="min-w-0 flex-1 text-base leading-[1.375rem] font-medium">{label}</span>
              <span className="inline-flex shrink-0 items-baseline gap-1 rounded-full bg-muted px-3 py-1 text-sm whitespace-nowrap text-muted-foreground">
                <b className="text-base font-[650] text-foreground">{formatPoints(value)}</b> / {max}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Ring({ value, width }: { value: number; width: number }) {
  const r = 50 - width / 2
  return (
    <svg viewBox="0 0 100 100" className="size-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth={width} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${Math.max(0, Math.min(1, value)) * 100} 100`}
      />
    </svg>
  )
}

function GrantPanel({ state, matched }: { state: AdvisorState; matched: boolean }) {
  const similarity = state.grantMatch?.similarity_pct
  const threshold = state.grantMatch ? Math.round((1 - state.grantMatch.threshold) * 100) : undefined
  const model = state.grantMatch?.matched_model_name?.replace(/^Model\s+\d+:\s*/, '')
  const rows = [
    state.maxFundingPln ? { icon: IconCoins, label: 'Maks. dofinansowanie', value: formatPln(state.maxFundingPln) } : undefined,
    state.coFinancingPct ? { icon: IconPercentage, label: 'Wkład własny', value: `${100 - state.coFinancingPct}%` } : undefined,
    model ? { icon: IconBulb, label: 'Dopasowany model ROPS', value: model } : undefined,
  ].filter((row) => row !== undefined)

  return (
    <section aria-labelledby="advisor-grant-title" className={cn(panel, 'gap-[1.125rem]')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.8125rem] font-bold tracking-[0.06em] text-primary uppercase">Dopasowany nabór</span>
        <span
          className={cn(
            'inline-flex min-h-[2.125rem] items-center gap-2 rounded-full px-3.5 py-1 text-[0.9375rem] font-[650]',
            matched ? 'bg-[#E2F4EC] text-[#0F5F45]' : 'bg-[#FFF7E6] text-[#7A4B00]',
          )}
        >
          {matched ? <IconCircleCheck aria-hidden="true" className="size-4" /> : <IconCircleX aria-hidden="true" className="size-4" />}
          {matched ? 'Kwalifikuje się' : 'Nie kwalifikuje się'}
        </span>
      </div>
      <h2 id="advisor-grant-title" className="text-[1.625rem] leading-8 font-[650] tracking-[-0.02em]">
        {state.grantTitle ?? 'Usługa Wrażliwa - II nabór'}
      </h2>

      {similarity !== undefined && threshold !== undefined && (
        <div className="flex flex-col gap-2.5 rounded-[1.125rem] bg-primary-soft px-5 py-[1.125rem]">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[0.9375rem] font-semibold text-[#3B4757]">Zbieżność pomysłu z naborem</span>
            <span className="text-[1.875rem] leading-[2.125rem] font-bold tracking-[-0.02em] text-primary-strong">{Math.round(similarity)}%</span>
          </div>
          <div role="img" aria-label={`Zbieżność ${Math.round(similarity)}%, próg kwalifikacji ${threshold}%`} className="relative h-3 rounded-full bg-white shadow-[inset_0_0_0_1px_#CFDDF0]">
            <i className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${Math.min(100, similarity)}%` }} />
            <span className="absolute -top-[5px] -bottom-[5px] -ml-[1.5px] w-[3px] rounded-sm bg-foreground" style={{ left: `${threshold}%` }} />
          </div>
          <span className="text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
            Próg kwalifikacji: {threshold}% - pomysł {similarity >= threshold ? 'go przekracza' : 'jest poniżej progu'}.
          </span>
        </div>
      )}

      {rows.length > 0 && (
        <dl className="flex flex-col">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3.5 border-b py-3 last:border-b-0">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
                <Icon className="size-5" />
              </span>
              <dt className="flex-1 text-[0.9375rem] text-[#3B4757]">{label}</dt>
              <dd className="max-w-[60%] text-right text-base leading-[1.375rem] font-[650]">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function BudgetPanel({ total }: { total: number }) {
  return (
    <section aria-labelledby="advisor-budget-title" className={cn(panel, 'gap-[1.125rem]')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="advisor-budget-title" className={panelTitle}>
          Podział budżetu
        </h2>
        <span className="text-[0.9375rem] text-muted-foreground">Razem {formatPln(total)} · według zasad oceny ROPS</span>
      </div>
      <div aria-hidden="true" className="flex h-[1.125rem] gap-[3px] overflow-hidden rounded-full">
        {BUDGET.map((part) => (
          <i key={part.label} className="h-full" style={{ width: `${part.share * 100}%`, background: part.color }} />
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {BUDGET.map((part) => (
          <li key={part.label} className="flex items-start gap-2.5">
            <i aria-hidden="true" className="mt-[5px] size-3 shrink-0 rounded" style={{ background: part.color }} />
            <span className="text-sm leading-5 text-muted-foreground">
              <b className="block text-lg leading-6 font-[650] text-foreground">{formatPln(total * part.share)}</b>
              {part.label} · {part.percent}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Sources({ state, matched }: { state: AdvisorState; matched: boolean }) {
  const seen = new Set<string>()
  const reports = state.citations.filter((citation) => {
    const key = `${citation.report_name}|${citation.page_number}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const sources = [
    ...reports.map((citation) => ({
      title: citation.report_name,
      kind: 'Raport ROPS',
      meta: [
        citation.year,
        citation.page_number && `str. ${citation.page_number}`,
        citation.relevance_score !== undefined && `trafność ${Math.round(citation.relevance_score * 100)}%`,
      ]
        .filter(Boolean)
        .join(' · '),
    })),
    ...(state.innovation ? [{ title: state.innovation, kind: 'Innowacja', meta: 'Biblioteka Innowacji ROPS' }] : []),
    ...(matched && state.grantTitle ? [{ title: `${state.grantTitle}: regulamin`, kind: 'Nabór', meta: 'Karta oceny merytorycznej' }] : []),
  ]

  return (
    <section aria-labelledby="advisor-sources-title" className={cn(panel, 'gap-1.5')}>
      <h2 id="advisor-sources-title" className={cn(panelTitle, 'mb-2')}>
        Źródła
      </h2>
      {sources.length === 0 ? (
        <p className="text-[0.9375rem] text-muted-foreground">Doradca nie podał źródeł dla tej analizy.</p>
      ) : (
        <ul className="flex flex-col">
          {sources.map((source, i) => (
            <li key={`${source.kind}-${i}`} className="flex flex-col gap-1 border-b py-3.5 last:border-b-0 last:pb-0">
              <span className="text-[0.9375rem] leading-[1.375rem] font-semibold">{source.title}</span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] leading-[1.125rem] text-muted-foreground">
                <span className="inline-flex h-[1.375rem] items-center rounded-full bg-muted px-2 text-xs font-semibold text-[#3B4757]">{source.kind}</span>
                {source.meta && <span>{source.meta}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
