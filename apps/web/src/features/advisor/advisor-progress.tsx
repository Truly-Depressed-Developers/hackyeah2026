import { IconArrowRight, IconCheck, IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'
import { ghostButton, primaryButton } from '@/components/resident/controls'
import { useT, type MessageKey, type Translate } from '@/lib/i18n'
import { STEP_IDS, type StepId } from './advisor-stream'
import { aiBadge, panel, panelTitle } from './advisor-ui'
import { LiveDraft } from './live-draft'
import type { AdvisorState, LogEntry } from './use-advisor'

// The design's wording rather than the AI service's step titles, which read like log lines.
const STEPS: Record<StepId, { title: MessageKey; hint: MessageKey }> = {
  step_parse: { title: 'advisor.progress.parse', hint: 'advisor.progress.parseHint' },
  step_diagnosis: { title: 'advisor.progress.diagnosis', hint: 'advisor.progress.diagnosisHint' },
  step_innovation: { title: 'advisor.progress.innovation', hint: 'advisor.progress.innovationHint' },
  step_grant_check: { title: 'advisor.progress.grant', hint: 'advisor.progress.grantHint' },
  step_synthesis: { title: 'advisor.progress.synthesis', hint: 'advisor.progress.synthesisHint' },
}

function logLine(entry: LogEntry, t: Translate) {
  if (entry.kind === 'ai') return entry.text
  if (entry.kind === 'model') return t('advisor.progress.logModel', { name: entry.name })
  return t('advisor.progress.logFragments', { fragments: t.count('advisor.progress.fragments', entry.count), report: entry.report })
}

const LOG_SIZE = 4

const focusOnMount = (element: HTMLElement | null) => element?.focus()

interface AdvisorProgressProps {
  state: AdvisorState
  onShowResult: () => void
  onCancel: () => void
  onRetry: () => void
}

export function AdvisorProgress({ state, onShowResult, onCancel, onRetry }: AdvisorProgressProps) {
  const done = state.status === 'done'
  const activeIndex = state.active ? STEP_IDS.indexOf(state.active) : STEP_IDS.length - 1
  const t = useT()
  const log = [...state.log.map((entry) => logLine(entry, t)), ...(done ? [t('advisor.progress.logDone')] : [])]

  const showDraft = state.markdown !== '' || state.active === 'step_synthesis'

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto grid w-full max-w-[73.75rem] items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-labelledby="advisor-run-title" className={cn(panel, 'gap-[1.375rem]')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="advisor-run-title" className={panelTitle}>
              {done ? t('advisor.progress.doneTitle') : t('advisor.progress.title')}
            </h2>
            <span role="status" className="text-[0.9375rem] font-semibold text-[#3B4757]">
              {done ? t('advisor.progress.allSteps', { total: STEP_IDS.length }) : t('advisor.progress.step', { step: activeIndex + 1, total: STEP_IDS.length })}
            </span>
          </div>

          <ol className="flex flex-col">
            {STEP_IDS.map((id, i) => {
              const status = state.completed.includes(id) ? 'done' : id === state.active ? 'on' : 'wait'
              return (
                <li key={id} className="group relative flex gap-4 pb-[1.375rem] last:pb-0" data-status={status}>
                  {i < STEP_IDS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-[2.875rem] bottom-1 left-[1.3125rem] w-0.5 rounded-sm bg-border group-data-[status=done]:bg-[#9ED7BF]"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[0.9375rem] font-bold text-muted-foreground shadow-[inset_0_0_0_2px_var(--border)] group-data-[status=done]:bg-[#E2F4EC] group-data-[status=done]:text-[#0F6B4F] group-data-[status=done]:shadow-none group-data-[status=on]:animate-pulse group-data-[status=on]:bg-primary group-data-[status=on]:text-white group-data-[status=on]:shadow-[0_0_0_6px_rgb(34_99_173/0.15)] motion-reduce:animate-none"
                  >
                    {status === 'done' ? <IconCheck className="size-5" /> : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[1.0625rem] leading-6 font-[650] group-data-[status=wait]:text-muted-foreground">{t(STEPS[id].title)}</span>
                    <span className="text-sm leading-5 text-muted-foreground">{t(STEPS[id].hint)}</span>
                    <span className="mt-1 inline-flex h-6 w-fit items-center rounded-full bg-muted px-2.5 text-xs font-semibold text-muted-foreground group-data-[status=done]:bg-[#E2F4EC] group-data-[status=done]:text-[#0F6B4F] group-data-[status=on]:bg-primary-soft group-data-[status=on]:text-primary-strong">
                      {status === 'done' ? t('advisor.progress.statusDone') : status === 'on' ? t('advisor.progress.statusOn') : t('advisor.progress.statusWait')}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>

          {state.status === 'error' && (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-[1.125rem] border border-destructive p-5">
              <p className="font-semibold text-destructive">
                {state.error === 'rate-limit' ? t('advisor.progress.errorRateLimit') : t('advisor.progress.errorFailed')}
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onRetry} className={primaryButton}>
                  {t('common.retry')}
                </button>
                <button type="button" onClick={onCancel} className={ghostButton}>
                  {t('advisor.changeIdea')}
                </button>
              </div>
            </div>
          )}

          {done && (
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-[1.125rem] bg-[#F2FAF6] px-5 py-[1.125rem] shadow-[inset_0_0_0_1px_#BFE3D2]">
              <span className="flex flex-col gap-0.5">
                <span className="text-[1.0625rem] font-[650] text-[#0F5F45]">{t('advisor.progress.readyTitle')}</span>
                <span className="text-[0.9375rem] text-[#3B4757]">{t('advisor.progress.readyText')}</span>
              </span>
              {/* Focused on mount: the step list the user was watching has nothing left to do. */}
              <button type="button" ref={focusOnMount} onClick={onShowResult} className={primaryButton}>
                {t('advisor.progress.showResult')}
                <IconArrowRight aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        <aside aria-label={t('advisor.progress.asideLabel')} className="flex flex-col gap-4">
          <div className={cn(panel, 'gap-3.5 px-6 py-[1.375rem]')}>
            <span className={aiBadge}>
              <IconSparkles aria-hidden="true" />
              {t('advisor.progress.now')}
            </span>
            <ul className="flex flex-col gap-2.5">
              {log.slice(-LOG_SIZE).map((line, i) => (
                <li key={`${log.length}-${i}`} className="flex items-start gap-2.5 text-[0.9375rem] leading-[1.375rem] text-[#26303D]">
                  <IconSparkles aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-[#6A4FE0]" />
                  <span className="min-w-0 break-words">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={cn(panel, 'gap-3.5 px-6 py-[1.375rem]')}>
            <span className="text-base font-[650]">{t('advisor.progress.resources')}</span>
            <dl className="grid grid-cols-3 gap-2.5">
              {[
                ['51', t('advisor.progress.reports')],
                ['114', t('advisor.progress.innovations')],
                ['31', t('advisor.progress.calls')],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse gap-0.5 rounded-[0.875rem] bg-muted px-3 py-3">
                  <dt className="text-[0.8125rem] leading-[1.125rem] break-words text-muted-foreground">{label}</dt>
                  <dd className="text-lg font-[650]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {state.status === 'running' && (
            <button type="button" onClick={onCancel} className={cn(ghostButton, 'self-start')}>
              {t('advisor.progress.cancel')}
            </button>
          )}
        </aside>
      </div>

      {showDraft && <LiveDraft markdown={state.markdown} writing={state.status === 'running'} />}
    </div>
  )
}
